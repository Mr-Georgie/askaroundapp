import admin, { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized.
// This will use Application Default Credentials on App Hosting.
// For local development, you need to be authenticated via `gcloud auth application-default login`.
import serviceAccount from '../../serviceAccountKey.json' with { type: 'json' };

if (!admin.apps.length) {
  // Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
  // You may need to add your databaseURL if it's not in your service account file
  // databaseURL: 'https://[YOUR_PROJECT_ID].firebaseio.com',
});
}

export const dbAdmin = admin.firestore();
export default admin;