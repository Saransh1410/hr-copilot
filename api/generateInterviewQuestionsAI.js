const { verifyAuth } = require('./utils/auth');
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

    const { job, candidate } = req.body;
    if (!job || !candidate) {
        return res.status(400).json({ error: 'Missing required fields: job or candidate.' });
    }

    try {
        const result = await GroqAI.generateInterviewQuestions(job, candidate);
        return res.status(200).json(result);
    } catch (e) {
        console.error("Error in generateInterviewQuestionsAI endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
