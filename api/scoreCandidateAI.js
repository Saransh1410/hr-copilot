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

    const { resumeText, job } = req.body;
    if (!resumeText || !job) {
        return res.status(400).json({ error: 'Missing required fields: resumeText or job.' });
    }

    try {
        const result = await GroqAI.scoreCandidate(resumeText, job);
        return res.status(200).json(result);
    } catch (e) {
        console.error("Error in scoreCandidateAI endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
