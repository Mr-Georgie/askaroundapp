import admin, { ServiceAccount } from "firebase-admin";
import { config } from "dotenv";
import { extractKeywords, STOP_WORDS } from "./keywordExtractor";
config();

// IMPORTANT: Before running this script, you must have your service account
// credentials available as environment variables.
// You can set them in a .env file at the root of your project.
// Find the values in the serviceAccountKey.json file from your Firebase project.
// For FIREBASE_PRIVATE_KEY, copy the entire key string, including the
// begin and end markers, and enclose it in quotes in your .env file.
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// A more thorough check to ensure all required fields are present.
const requiredFields = ["project_id", "private_key", "client_email"];
const missingFields = requiredFields.filter(
  (field) => !serviceAccount[field as keyof typeof serviceAccount]
);

if (missingFields.length > 0) {
  console.error("Missing Firebase Admin credentials in environment variables.");
  console.error(
    "Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in your .env file."
  );
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

const users = [
  {
    id: "seed_user_alice",
    name: "Alice",
    avatarUrl: "https://placehold.co/100x100/f9a8d4/4c1d95",
  },
  {
    id: "seed_user_bob",
    name: "Bob",
    avatarUrl: "https://placehold.co/100x100/a5b4fc/1e1b4b",
  },
  {
    id: "seed_user_charlie",
    name: "Charlie",
    avatarUrl: "https://placehold.co/100x100/fde047/422006",
  },
  {
    id: "seed_user_diana",
    name: "Diana",
    avatarUrl: "https://placehold.co/100x100/6ee7b7/064e3b",
  },
];

const questions = [
  {
    text: "Where can I find the best Neapolitan pizza near Times Square?",
    categoryEmoji: "🍕",
    user: users[0],
    answers: [
      {
        text: "Luigi's Pizzeria on 5th Ave (across from the NY Public Library) has the most authentic Neapolitan pizza I've ever had!",
        user: users[1],
      },
      {
        text: "Seconding Luigi's! Their Margherita is to die for. Perfect crust and just two blocks from Rockefeller Center.",
        user: users[2],
      },
    ],
  },
  {
    text: "Looking for a reliable and stylish barbershop near Central Park. Any recommendations?",
    categoryEmoji: "✂️",
    user: users[2],
    answers: [
      {
        text: "The Gilded Razor near Columbus Circle is top-notch. Pricey but worth it for the quality and experience.",
        user: users[3],
      },
      {
        text: "For something more classic, try 'The Corner Clip' by the Flatiron Building. Old-school vibe with great cuts.",
        user: users[0],
      },
    ],
  },
  {
    text: "Best running trail with a good mix of shade and sun near Golden Gate Park?",
    categoryEmoji: "🏃",
    user: users[3],
    answers: [
      {
        text: "The Oakwood Park loop (near the de Young Museum) is my go-to. Beautiful tree canopy covers half the trail.",
        user: users[1],
      },
    ],
  },
  {
    text: "Any quiet coffee shops with strong Wi-Fi near the Space Needle for remote work?",
    categoryEmoji: "☕",
    user: users[1],
    answers: [
      {
        text: "The Daily Grind at Pike Place Market is perfect. Fast Wi-Fi, plenty of outlets (but busy during lunch).",
        user: users[0],
      },
      {
        text: "Bean Scene near the Seattle Art Museum has a dedicated quiet zone upstairs. Great afternoon spot.",
        user: users[3],
      },
    ],
  },
  {
    text: "Where can I find the best suya near the National Theatre in Iganmu?",
    categoryEmoji: "🍢",
    user: users[1],
    answers: [
      {
        text: "Mama Hadija's Suya Spot right beside the National Theatre main gate! Her spicy beef suya with fresh onions is legendary.",
        user: users[2],
      },
      {
        text: "For gourmet suya, try 'Yahuza Suya Express' at the Eko Hotel roundabout. Their chicken suya with special yaji is worth the queue.",
        user: users[0],
      }
    ],
  },
  {
    text: "Best place for boat rides with views of Third Mainland Bridge?",
    categoryEmoji: "⛵",
    user: users[3],
    answers: [
      {
        text: "Lagoon Restaurant at Victoria Island has sunset cruises that go under the bridge. You get amazing skyline views of Ikoyi and Lagos Island.",
        user: users[1],
      },
      {
        text: "Check out the Makoko Floating Tours - they start near the bridge's Adekunle exit point. Local guides show you the stilt communities and bridge architecture.",
        user: users[2],
      }
    ],
  }
];

const seedDatabase = async () => {
  console.log("Starting to seed database...");

  // --- Clear existing seeded data ---
  console.log("Clearing existing seeded data...");
  const collectionsToClear = ["questions", "answers", "users", "keywords"];
  for (const collectionName of collectionsToClear) {
    const snapshot = await db
      .collection(collectionName)
      .where("user.id", "in", [
        "seed_user_alice",
        "seed_user_bob",
        "seed_user_charlie",
        "seed_user_diana",
      ])
      .get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(
        `Deleted ${snapshot.size} old documents from ${collectionName}.`
      );
    }
  }

  // Seed Users
  const userBatch = db.batch();
  for (const user of users) {
    const userRef = db.collection("users").doc(user.id);
    userBatch.set(
      userRef,
      { name: user.name, avatarUrl: user.avatarUrl, id: user.id },
      { merge: true }
    );
  }
  await userBatch.commit();
  console.log(`Seeded ${users.length} users.`);

  // Seed Questions, Answers, and Keywords
  const keywordBatch = db.batch();

  for (const q of questions) {
    const keywords = extractKeywords(q.text);
    const questionData = {
      text: q.text,
      categoryEmoji: q.categoryEmoji,
      user: {
        id: q.user.id,
        name: q.user.name,
        avatarUrl: q.user.avatarUrl,
      },
      votes: Math.floor(Math.random() * 50),
      answersCount: q.answers.length,
      distance: `${(Math.random() * 5).toFixed(1)}km away`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      keywords: keywords,
      status: "active",
      isFlagged: false,
    };

    const questionRef = await db.collection("questions").add(questionData);
    console.log(`Added question: "${q.text}"`);

    // Increment keyword counts
    for (const keyword of keywords) {
      const keywordRef = db.collection("keywords").doc(keyword);
      keywordBatch.set(
        keywordRef,
        { count: admin.firestore.FieldValue.increment(1) },
        { merge: true }
      );
    }

    if (q.answers.length > 0) {
      const answerBatch = db.batch();
      for (const a of q.answers) {
        const answerRef = questionRef.collection("answers").doc();
        answerBatch.set(answerRef, {
          text: a.text,
          user: {
            id: a.user.id,
            name: a.user.name,
            avatarUrl: a.user.avatarUrl,
          },
          votes: Math.floor(Math.random() * 20),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          questionId: questionRef.id,
          status: "active",
          isFlagged: false,
        });
      }
      await answerBatch.commit();
      console.log(`Added ${q.answers.length} answers.`);
    }
  }

  await keywordBatch.commit();
  console.log("Updated keyword counts.");

  console.log("--------------------");
  console.log("Seeding finished.");
  console.log("--------------------");
};

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });
