const { verifyAuth } = require('./utils/auth');
const { db } = require('./utils/db');
const GroqAI = require('./utils/groq');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const decodedToken = await verifyAuth(req, res);
    if (!decodedToken) return;

    const { history } = req.body;
    if (!history) {
        return res.status(400).json({ error: 'Missing required field: history.' });
    }

    const uid = decodedToken.uid;

    try {
        // Securely load real-time collections directly from Firestore
        const jobsSnap = await db.collection('users').doc(uid).collection('appData').doc('jobs').get();
        const candsSnap = await db.collection('users').doc(uid).collection('appData').doc('candidates').get();
        const intsSnap = await db.collection('users').doc(uid).collection('appData').doc('interviews').get();

        const jobs = jobsSnap.exists ? (jobsSnap.data().value || []) : [];
        const cands = candsSnap.exists ? (candsSnap.data().value || []) : [];
        const ints = intsSnap.exists ? (intsSnap.data().value || []) : [];

        const reply = await GroqAI.chat(history, jobs, cands, ints);
        return res.status(200).json({ reply });
    } catch (e) {
        console.error("Error in chatWithCopilotAI endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
