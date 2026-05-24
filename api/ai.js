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

    const { action } = req.body;
    if (!action) {
        return res.status(400).json({ error: 'Missing required field: action.' });
    }

    const uid = decodedToken.uid;

    try {
        switch (action) {
            case 'chat': {
                const { history } = req.body;
                if (!history) {
                    return res.status(400).json({ error: 'Missing required field: history.' });
                }
                // Securely load real-time collections directly from Firestore
                const jobsSnap = await db.collection('users').doc(uid).collection('appData').doc('jobs').get();
                const candsSnap = await db.collection('users').doc(uid).collection('appData').doc('candidates').get();
                const intsSnap = await db.collection('users').doc(uid).collection('appData').doc('interviews').get();

                const jobs = jobsSnap.exists ? (jobsSnap.data().value || []) : [];
                const cands = candsSnap.exists ? (candsSnap.data().value || []) : [];
                const ints = intsSnap.exists ? (intsSnap.data().value || []) : [];

                const reply = await GroqAI.chat(history, jobs, cands, ints);
                return res.status(200).json({ reply });
            }
            case 'analyze': {
                const { resumeText, job, personalityScores } = req.body;
                if (!resumeText || !job || !personalityScores) {
                    return res.status(400).json({ error: 'Missing required fields: resumeText, job, or personalityScores.' });
                }
                const result = await GroqAI.analyzeWithPersonality(resumeText, job, personalityScores);
                return res.status(200).json(result);
            }
            case 'generateQuestions': {
                const { job, candidate } = req.body;
                if (!job || !candidate) {
                    return res.status(400).json({ error: 'Missing required fields: job or candidate.' });
                }
                const result = await GroqAI.generateInterviewQuestions(job, candidate);
                return res.status(200).json(result);
            }
            case 'score': {
                const { resumeText, job } = req.body;
                if (!resumeText || !job) {
                    return res.status(400).json({ error: 'Missing required fields: resumeText or job.' });
                }
                const result = await GroqAI.scoreCandidate(resumeText, job);
                return res.status(200).json(result);
            }
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (e) {
        console.error(`Error in /api/ai action ${action}:`, e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
