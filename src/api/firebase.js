import admin from 'firebase-admin';
import fs from 'fs';

let serviceAccount;

const secretPath = '/run/secrets/firebase_key.json';
if (fs.existsSync(secretPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
} else {
  serviceAccount = JSON.parse(fs.readFileSync(new URL('./firebase_key.json', import.meta.url), 'utf8'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export { admin, db };
