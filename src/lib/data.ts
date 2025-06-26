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
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Question,
  Answer,
  User,
  SageMessage,
  SageConversation,
  AppNotification,
} from "./types";

// Helper to convert any Firestore Timestamps to JS Date objects
// Add this utility function if you don't have it already
const convertTimestamps = (data: any) => {
  if (!data) return data;

  // Convert Firestore Timestamp to JavaScript Date
  if (data.timestamp?.toDate) {
    return {
      ...data,
      timestamp: data.timestamp.toDate().toISOString(),
    };
  }

  // If it's already a Date object
  if (data.timestamp instanceof Date) {
    return {
      ...data,
      timestamp: data.timestamp.toISOString(),
    };
  }

  // If it's already a string (ISO format), leave it as is
  if (typeof data.timestamp === "string") {
    return data;
  }

  // If timestamp is missing, set to current time
  return {
    ...data,
    timestamp: new Date().toISOString(),
  };
};

export const getQuestions = async (): Promise<Question[]> => {
  const q = query(collection(db, "questions"), orderBy("timestamp", "desc"));
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
      questionData.answers = answersSnapshot.docs.map((answerDoc) =>
        convertTimestamps({ id: answerDoc.id, ...answerDoc.data() } as Answer)
      );
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

    const answersQuery = query(
      collection(db, `questions/${id}/answers`),
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

  // A simple list of common English stop words to filter out.
  const STOP_WORDS = new Set([
    "a",
    "about",
    "an",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "what",
    "when",
    "where",
    "who",
    "will",
    "with",
    "the",
    "i",
    "your",
    "you",
    "can",
    "find",
  ]);

  // Clean and split the query string into meaningful words.
  const queryWords = new Set(
    queryString
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .split(/\s+/)
      .filter((word) => word && !STOP_WORDS.has(word)) // Ensure word is not empty and not a stop word
  );

  if (queryWords.size === 0) return [];

  // This is inefficient as it fetches all documents.
  // For a production app, use a dedicated search service like Algolia or Firebase Extensions.
  const allQuestions = await getQuestions();

  const scoredQuestions = allQuestions
    .map((question) => {
      // Also clean the question text for a fair comparison.
      const questionTextLower = question.text
        .toLowerCase()
        .replace(/[^\w\s]/g, "");

      let score = 0;
      queryWords.forEach((word) => {
        // Use a regex with word boundaries (\b) to match whole words only.
        // This prevents 'art' from matching 'start' or 'barter'.
        const wordBoundaryRegex = new RegExp(`\\b${word}\\b`);
        if (wordBoundaryRegex.test(questionTextLower)) {
          score++;
        }
      });
      return { question, score };
    })
    .filter((item) => item.score > 0) // Only include questions with at least one matching word
    .sort((a, b) => b.score - a.score); // Sort by relevance score (descending)

  return scoredQuestions.map((item) => item.question);
};

export const addQuestion = async (questionData: {
  text: string;
  categoryEmoji: string;
  user: User;
}) => {
  try {
    await addDoc(collection(db, "questions"), {
      ...questionData,
      votes: 0,
      answersCount: 0,
      distance: `${(Math.random() * 5).toFixed(1)}km away`, // Mock distance
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Error adding question: ", e);
    throw e;
  }
};

export const addAnswer = async (
  questionId: string,
  answerData: { text: string; user: User; photoUrl?: string }
) => {
  try {
    const questionRef = doc(db, "questions", questionId);
    const questionSnap = await getDoc(questionRef);
     if (!questionSnap.exists()) {
      throw new Error('Question to answer not found');
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
    });

    batch.update(questionRef, { answersCount: increment(1) });

    // Create a notification for the question author, but not if they answer their own question
    if (questionAuthorId !== answerData.user.id) {
        const notificationsRef = doc(collection(db, `users/${questionAuthorId}/notifications`));
        batch.set(notificationsRef, {
            type: 'NEW_ANSWER',
            read: false,
            questionId: questionId,
            questionText: questionData.text.length > 50 ? `${questionData.text.substring(0, 47)}...` : questionData.text,
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
  } catch (e) {
    console.error("Error updating vote: ", e);
  }
};

export const createSageConversation = async (
  userId: string,
  firstMessage: string
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, `users/${userId}/sageConversations`),
      {
        userId,
        title: firstMessage.slice(0, 50), // Truncate for title
        lastMessageText: firstMessage,
        timestamp: serverTimestamp(), // Use Firestore server timestamp
      }
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const getSageConversations = async (
  userId: string
): Promise<SageConversation[]> => {
  try {
    const conversationsQuery = query(
      collection(db, `users/${userId}/sageConversations`),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(conversationsQuery);

    return querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId,
        title: data.title || "New Conversation",
        lastMessageText: data.lastMessageText || "",
        timestamp:
          data.timestamp?.toDate?.().toISOString() || new Date().toISOString(),
      } as SageConversation;
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
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
  message: { sender: "user" | "sage"; text: string; timestamp: string }
) => {
  const batch = writeBatch(db);
  const conversationRef = doc(
    db,
    `users/${userId}/sageConversations`,
    conversationId
  );
  const messagesRef = collection(conversationRef, "messages");

  batch.set(doc(messagesRef), {
    ...message,
    conversationId,
    timestamp: serverTimestamp(),
  });

  batch.update(conversationRef, {
    lastMessageText: message.text,
    timestamp: serverTimestamp(),
  });

  await batch.commit();
};

export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
    const notificationsQuery = query(
        collection(db, `users/${userId}/notifications`),
        orderBy('timestamp', 'desc'),
        limit(30)
    );
    const querySnapshot = await getDocs(notificationsQuery);
    return querySnapshot.docs.map(docSnapshot =>
        convertTimestamps({
            id: docSnapshot.id,
            ...docSnapshot.data(),
        }) as AppNotification
    );
}

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    const notificationRef = doc(db, `users/${userId}/notifications`, notificationId);
    try {
        await updateDoc(notificationRef, { read: true });
    } catch (e) {
        console.error("Error marking notification as read: ", e);
    }
}
