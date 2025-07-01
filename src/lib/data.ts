import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  updateDoc,
  increment,
  writeBatch,
  limit,
  where,
  collectionGroup,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Question,
  Answer,
  User,
  SageMessage,
  SageConversation,
  AppNotification,
  Keyword,
  AdminStats,
  AdminSearchResult,
} from "./types";
import { extractKeywords, STOP_WORDS } from "../../scripts/keywordExtractor";

// Helper to convert any Firestore Timestamps to JS Date objects
const convertTimestamps = <T>(data: T): T => {
  if (!data) return data;
  const convertedData = { ...data };
  for (const key in convertedData) {
    const value = convertedData[key as keyof T];
    if (value instanceof Timestamp) {
      (convertedData as any)[key] = value.toDate();
    } else if (value && typeof value === "object") {
      // Recursively convert for nested objects and arrays
      if (Array.isArray(value)) {
        (convertedData as any)[key] = value.map((item) =>
          typeof item === "object" ? convertTimestamps(item) : item
        );
      } else {
        (convertedData as any)[key] = convertTimestamps(value);
      }
    }
  }
  return convertedData;
};

export const getQuestions = async (): Promise<Question[]> => {
  const q = query(
    collection(db, "questions"),
    where("status", "==", "active"),
    orderBy("timestamp", "desc")
  );
  const querySnapshot = await getDocs(q);
  return Promise.all(
    querySnapshot.docs.map(async (docSnapshot) => {
      const questionData = convertTimestamps({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }) as Question;

      const answersSnapshot = await getDocs(
        query(
          collection(db, `questions/${docSnapshot.id}/answers`),
          orderBy("timestamp", "desc")
        )
      );
      questionData.answers = answersSnapshot.docs
        .map((answerDoc) =>
          convertTimestamps({ id: answerDoc.id, ...answerDoc.data() } as Answer)
        )
        .filter((answer) => answer.status === "active");

      return questionData;
    })
  );
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  const docRef = doc(db, "questions", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const questionData = convertTimestamps({
      id: docSnap.id,
      ...docSnap.data(),
    } as Question);

    if (questionData.status === "deleted") {
      return null;
    }

    const answersQuery = query(
      collection(db, `questions/${id}/answers`),
      where("status", "==", "active"),
      orderBy("timestamp", "asc")
    );
    const answersSnapshot = await getDocs(answersQuery);
    const answers = answersSnapshot.docs.map((doc) =>
      convertTimestamps({ id: doc.id, ...doc.data() } as Answer)
    );

    questionData.answers = answers;
    questionData.answersCount = answers.length;

    return questionData;
  } else {
    return null;
  }
};

export const findSimilarQuestions = async (
  queryString: string
): Promise<Question[]> => {
  if (!queryString.trim()) return [];

  const queryWords = new Set(
    queryString
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word && !STOP_WORDS.has(word))
  );

  if (queryWords.size === 0) return [];

  const allQuestions = await getQuestions();

  const scoredQuestions = allQuestions
    .map((question) => {
      const questionTextLower = question.text
        .toLowerCase()
        .replace(/[^\w\s]/g, "");

      let score = 0;
      queryWords.forEach((word) => {
        const wordBoundaryRegex = new RegExp(`\\b${word}\\b`);
        if (wordBoundaryRegex.test(questionTextLower)) {
          score++;
        }
      });
      return { question, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredQuestions.map((item) => item.question);
};

export const addQuestion = async (questionData: {
  text: string;
  categoryEmoji: string;
  user: User;
}) => {
  const batch = writeBatch(db);

  // 1. Add the new question
  const questionRef = doc(collection(db, "questions"));
  const keywords = extractKeywords(questionData.text);

  batch.set(questionRef, {
    ...questionData,
    votes: 0,
    answersCount: 0,
    distance: `${(Math.random() * 5).toFixed(1)}km away`,
    timestamp: serverTimestamp(),
    keywords,
    status: "active",
    isFlagged: false,
  });

  // 2. Update keyword counts
  for (const keyword of keywords) {
    const keywordRef = doc(db, "keywords", keyword);
    batch.set(keywordRef, { count: increment(1) }, { merge: true });
  }

  await batch.commit();
};

export const addAnswer = async (
  questionId: string,
  answerData: { text: string; user: User; photoUrl?: string }
) => {
  try {
    const questionRef = doc(db, "questions", questionId);
    const questionSnap = await getDoc(questionRef);
    if (!questionSnap.exists()) {
      throw new Error("Question to answer not found");
    }
    const questionData = questionSnap.data() as Question;
    const questionAuthorId = questionData.user.id;

    const answersCollectionRef = collection(questionRef, "answers");

    const batch = writeBatch(db);

    const newAnswerRef = doc(answersCollectionRef);
    batch.set(newAnswerRef, {
      ...answerData,
      questionId,
      votes: 0,
      timestamp: serverTimestamp(),
      status: "active",
      isFlagged: false,
    });

    batch.update(questionRef, { answersCount: increment(1) });

    if (questionAuthorId !== answerData.user.id) {
      const notificationsRef = doc(
        collection(db, `users/${questionAuthorId}/notifications`)
      );
      batch.set(notificationsRef, {
        type: "NEW_ANSWER",
        read: false,
        questionId: questionId,
        questionText:
          questionData.text.length > 50
            ? `${questionData.text.substring(0, 47)}...`
            : questionData.text,
        actor: answerData.user,
        timestamp: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (e) {
    console.error("Error adding answer: ", e);
    throw e;
  }
};

const SOFT_DELETE_THRESHOLD = -5;
export const updateVote = async (
  collectionName: "questions" | "answers",
  docId: string,
  change: 1 | -1,
  questionId?: string
) => {
  const docPath =
    collectionName === "questions"
      ? `questions/${docId}`
      : `questions/${questionId}/answers/${docId}`;
  const docRef = doc(db, docPath);

  try {
    await updateDoc(docRef, { votes: increment(change) });
    const updatedDoc = await getDoc(docRef);
    const newVotes = updatedDoc.data()?.votes;

    if (newVotes <= SOFT_DELETE_THRESHOLD) {
      await updateDoc(docRef, { status: "deleted" });
    }
  } catch (e) {
    console.error("Error updating vote: ", e);
  }
};

export const getNotifications = async (
  userId: string
): Promise<AppNotification[]> => {
  const notificationsQuery = query(
    collection(db, `users/${userId}/notifications`),
    orderBy("timestamp", "desc"),
    limit(30)
  );
  const querySnapshot = await getDocs(notificationsQuery);
  return querySnapshot.docs.map(
    (docSnapshot) =>
      convertTimestamps({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }) as AppNotification
  );
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
) => {
  const notificationRef = doc(
    db,
    `users/${userId}/notifications`,
    notificationId
  );
  try {
    await updateDoc(notificationRef, { read: true });
  } catch (e) {
    console.error("Error marking notification as read: ", e);
  }
};

export async function createSageConversation(
  userId: string,
  title: string
): Promise<string> {
  const conversationsRef = collection(db, `users/${userId}/sageConversations`);
  const newConversation = {
    userId,
    title,
    timestamp: serverTimestamp(),
    lastMessageText: "...",
  };
  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
}

export const getSageConversations = async (
  userId: string
): Promise<SageConversation[]> => {
  const conversationsQuery = query(
    collection(db, `users/${userId}/sageConversations`),
    orderBy("timestamp", "desc")
  );
  const querySnapshot = await getDocs(conversationsQuery);
  return querySnapshot.docs.map((docSnapshot) =>
    convertTimestamps({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })
  ) as SageConversation[];
};

export const getSageMessages = async (
  userId: string,
  conversationId: string
): Promise<SageMessage[]> => {
  const messagesQuery = query(
    collection(
      db,
      `users/${userId}/sageConversations/${conversationId}/messages`
    ),
    orderBy("timestamp", "asc")
  );
  const querySnapshot = await getDocs(messagesQuery);
  return querySnapshot.docs.map((docSnapshot) =>
    convertTimestamps({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })
  ) as SageMessage[];
};

export const addSageMessage = async (
  userId: string,
  conversationId: string,
  message: { sender: "user" | "sage"; text: string; timestamp: Date }
) => {
  const batch = writeBatch(db);
  const conversationRef = doc(
    db,
    `users/${userId}/sageConversations`,
    conversationId
  );
  const messagesRef = collection(conversationRef, "messages");

  batch.set(doc(messagesRef), {
    sender: message.sender,
    text: message.text,
    conversationId,
    timestamp: message.timestamp,
  });

  // Only update conversation if it exists
  const conversationSnap = await getDoc(conversationRef);
  if (conversationSnap.exists()) {
    batch.update(conversationRef, {
      lastMessageText: message.text.substring(0, 100), // Truncate for safety
      timestamp: message.timestamp,
    });
  }

  await batch.commit();
};

export const getKeywords = async (count: number): Promise<Keyword[]> => {
  const keywordsQuery = query(
    collection(db, "keywords"),
    orderBy("count", "desc")
    // limit(count)
  );
  const snapshot = await getDocs(keywordsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Keyword));
};

export const getAdminStats = async (): Promise<AdminStats> => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const nonSeededUsers = usersSnap.docs.filter(doc => !doc.id.startsWith('seed_'));

    const questionsSnap = await getCountFromServer(collection(db, 'questions'));
    
    const sageConvos = await getDocs(collectionGroup(db, 'sageConversations'));
    const sageUserIds = new Set(sageConvos.docs.map(doc => doc.data().userId));
    const nonSeededSageUsers = [...sageUserIds].filter(id => !id.startsWith('seed_'));

    return {
        userCount: nonSeededUsers.length,
        questionCount: questionsSnap.data().count,
        sageUserCount: nonSeededSageUsers.length,
    };
}

export const searchContentForAdmin = async (
  searchText: string
): Promise<AdminSearchResult[]> => {
  if (!searchText) return [];

  const results: AdminSearchResult[] = [];
  const textLower = searchText.toLowerCase();

  // Search Questions
  const questionsQuery = query(collection(db, "questions"));
  const questionsSnapshot = await getDocs(questionsQuery);
  questionsSnapshot.forEach((doc) => {
    const data = doc.data() as Question;
    if (data.text.toLowerCase().includes(textLower)) {
      results.push({
        ...convertTimestamps(data),
        id: doc.id,
        type: "question",
      });
    }
  });

  // Search Answers
  const answersQuery = query(collectionGroup(db, "answers"));
  const answersSnapshot = await getDocs(answersQuery);
  answersSnapshot.forEach((doc) => {
    const data = doc.data() as Answer;
    if (data.text.toLowerCase().includes(textLower)) {
      results.push({ ...convertTimestamps(data), id: doc.id, type: "answer" });
    }
  });

  return results;
};

export const flagContent = async (
  type: "question" | "answer",
  id: string,
  questionId?: string
) => {
  let docRef;
  if (type === "question") {
    docRef = doc(db, "questions", id);
  } else {
    if (!questionId)
      throw new Error("questionId is required for flagging an answer");
    docRef = doc(db, `questions/${questionId}/answers/${id}`);
  }
  await updateDoc(docRef, { isFlagged: true });
};
