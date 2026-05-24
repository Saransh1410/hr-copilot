const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
        try {
            let serviceAccount;
            const trimmed = serviceAccountVar.trim();
            if (trimmed.startsWith('{')) {
                serviceAccount = JSON.parse(trimmed);
            } else {
                serviceAccount = JSON.parse(Buffer.from(trimmed, 'base64').toString('ascii'));
            }
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin successfully initialized via service account.");
        } catch (e) {
            console.error("Firebase Admin initialization error:", e);
            admin.initializeApp();
        }
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT environment variable not found. Initializing with default credentials.");
        admin.initializeApp();
    }
}

const db = admin.firestore();

async function getSettings(uid) {
    try {
        const doc = await db.collection('users').doc(uid).collection('appData').doc('settings').get();
        return doc.exists ? (doc.data().value || {}) : {};
    } catch (e) {
        console.error("Failed to load settings for", uid, e);
        return {};
    }
}

module.exports = { admin, db, getSettings };
