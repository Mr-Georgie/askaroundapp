import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized.
// This will use Application Default Credentials on App Hosting.
// For local development, you need to be authenticated via `gcloud auth application-default login`.
if (!admin.apps.length) {
  admin.initializeApp();
}

export const dbAdmin = admin.firestore();
export default admin;