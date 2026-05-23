import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../../config/env.js";
import { getApiIntegrationSettings } from "../../modules/admin/admin-settings.service.js";
import { HttpError } from "../../utils/http-error.js";

const normalizePrivateKey = (privateKey?: string) => privateKey?.replace(/\\n/g, "\n");

const getFirebaseAdminConfig = async () => {
  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { kind: "applicationDefault" as const };
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      kind: "serviceAccount" as const,
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY
    };
  }

  const settings = await getApiIntegrationSettings();
  if (
    settings.firebaseProjectId &&
    settings.firebaseAdminClientEmail &&
    settings.firebaseAdminPrivateKey
  ) {
    return {
      kind: "serviceAccount" as const,
      projectId: settings.firebaseProjectId,
      clientEmail: settings.firebaseAdminClientEmail,
      privateKey: settings.firebaseAdminPrivateKey
    };
  }

  return null;
};

export const isFirebaseConfigured = async () => Boolean(await getFirebaseAdminConfig());

export const getFirebaseAuth = async () => {
  const config = await getFirebaseAdminConfig();
  if (!config) {
    throw new HttpError(501, "Firebase Admin credentials are not configured.", "FIREBASE_NOT_CONFIGURED");
  }

  if (!getApps().length) {
    if (config.kind === "serviceAccount") {
      initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: normalizePrivateKey(config.privateKey)
        })
      });
    } else {
      initializeApp({
        credential: applicationDefault()
      });
    }
  }

  return getAuth();
};

export const verifyFirebaseIdToken = async (idToken: string) => {
  return (await getFirebaseAuth()).verifyIdToken(idToken);
};
