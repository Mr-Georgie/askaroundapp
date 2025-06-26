import admin, { ServiceAccount } from 'firebase-admin';

// IMPORTANT: Before running this script, you must download a service account key
// from your Firebase project settings.
// 1. Go to Project Settings -> Service Accounts.
// 2. Click "Generate new private key".
// 3. Rename the downloaded file to `serviceAccountKey.json` and place it in the project root.
import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  // You may need to add your databaseURL if it's not in your service account file
  // databaseURL: 'https://[YOUR_PROJECT_ID].firebaseio.com',
});

const db = admin.firestore();

// --- SAMPLE DATA ---
const users = [
  {
    id: 'seed_user_alice',
    name: 'Alice',
    avatarUrl: 'https://placehold.co/100x100/f9a8d4/4c1d95',
  },
  {
    id: 'seed_user_bob',
    name: 'Bob',
    avatarUrl: 'https://placehold.co/100x100/a5b4fc/1e1b4b',
  },
  {
    id: 'seed_user_charlie',
    name: 'Charlie',
    avatarUrl: 'https://placehold.co/100x100/fde047/422006',
  },
  {
    id: 'seed_user_diana',
    name: 'Diana',
    avatarUrl: 'https://placehold.co/100x100/6ee7b7/064e3b',
  },
];

const questions = [
  {
    text: 'Where can I find the best Neapolitan pizza in the downtown area?',
    categoryEmoji: '🍕',
    user: users[0],
    answers: [
      {
        text: "Luigi's Pizzeria on 5th Ave has the most authentic Neapolitan pizza I've ever had!",
        user: users[1],
      },
      {
        text: "Seconding Luigi's! Their Margherita is to die for. The crust is perfect.",
        user: users[2],
      },
    ],
  },
  {
    text: 'Looking for a reliable and stylish barbershop. Any recommendations?',
    categoryEmoji: '✂️',
    user: users[2],
    answers: [
      {
        text: 'The Gilded Razor is top-notch. A bit pricey but worth every penny for the quality and experience.',
        user: users[3],
      },
      {
        text: "If you want something more classic and affordable, check out 'The Corner Clip'. Old-school vibe, great cuts.",
        user: users[0],
      },
    ],
  },
  {
    text: 'Best running trail with a good mix of shade and sun?',
    categoryEmoji: '🏃',
    user: users[3],
    answers: [
      {
        text: 'The Oakwood Park loop is my go-to. It has a beautiful canopy of trees for about half of the trail.',
        user: users[1],
      },
    ],
  },
  {
    text: 'Any quiet coffee shops with strong Wi-Fi for remote work?',
    categoryEmoji: '☕',
    user: users[1],
    answers: [
      {
        text: 'The Daily Grind is perfect for that. Lots of outlets and the Wi-Fi is super fast. Can get a little busy during lunch rush though.',
        user: users[0],
      },
      {
        text: 'Bean Scene is another great option, especially in the afternoons. It has a dedicated quiet zone upstairs.',
        user: users[3],
      },
    ],
  },
];

const seedDatabase = async () => {
  console.log('Starting to seed database...');

  // --- Clear existing seeded data (optional, but recommended for clean runs) ---
  console.log('Clearing existing seeded data...');
  const existingQuestions = await db.collection('questions')
  .where('user.id', 'in', ['seed_user_alice', 'seed_user_bob', 'seed_user_charlie', 'seed_user_diana'])
  .get();
  
  if (!existingQuestions.empty) {
    const batch = db.batch();
    existingQuestions.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Deleted ${existingQuestions.size} old questions.`);
  }

  // Seed Users
  const userBatch = db.batch();
  for (const user of users) {
    const userRef = db.collection('users').doc(user.id);
    // Use set with merge to avoid overwriting real user data if IDs ever conflict
    userBatch.set(userRef, { name: user.name, avatarUrl: user.avatarUrl, id: user.id }, { merge: true });
  }
  await userBatch.commit();
  console.log(`Seeded ${users.length} users.`);


  // Seed Questions and Answers
  for (const q of questions) {
    const questionData = {
      text: q.text,
      categoryEmoji: q.categoryEmoji,
      user: {
        id: q.user.id,
        name: q.user.name,
        avatarUrl: q.user.avatarUrl
      },
      votes: Math.floor(Math.random() * 50),
      answersCount: q.answers.length,
      distance: `${(Math.random() * 5).toFixed(1)}km away`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const questionRef = await db.collection('questions').add(questionData);
    console.log(`Added question: "${q.text}"`);

    if (q.answers.length > 0) {
      const answerBatch = db.batch();
      for (const a of q.answers) {
        const answerRef = questionRef.collection('answers').doc();
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
        });
      }
      await answerBatch.commit();
      console.log(`Added ${q.answers.length} answers.`);
    }
  }

  console.log('--------------------');
  console.log('Seeding finished.');
  console.log('--------------------');
};

seedDatabase()
  .then(() => {
    // exit process
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
