import admin, { ServiceAccount } from "firebase-admin";

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

// Check for the most critical fields before initializing.
const hasRequiredCredentials = serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email;

// Initialize Firebase Admin SDK if not already initialized.
if (!admin.apps.length) {
  if (hasRequiredCredentials) {
    // In production environments like Vercel, or local dev with .env,
    // use service account from env vars.
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as ServiceAccount),
    });
  } else if (process.env.NODE_ENV !== "production") {
    // In local development, if env vars are missing, we warn the user.
    // This avoids crashing the server for pages that don't need the admin SDK.
    console.warn(
      "Firebase Admin SDK not initialized. Required environment variables " +
        "(FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) are missing. " +
        "Server-side Firebase features will be unavailable."
    );
  } else {
    // In production, we throw an error because the app cannot function correctly
    // without the admin SDK.
    throw new Error(
      "Firebase Admin SDK is not configured. Required environment variables are missing."
    );
  }
}

// Conditionally export dbAdmin. It will be undefined if initialization was skipped.
export const dbAdmin: admin.firestore.Firestore | undefined = admin.apps.length
  ? admin.firestore()
  : undefined;

export default admin;
