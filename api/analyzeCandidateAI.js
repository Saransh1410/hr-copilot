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

    const { resumeText, job, personalityScores } = req.body;
    if (!resumeText || !job || !personalityScores) {
        return res.status(400).json({ error: 'Missing required fields: resumeText, job, or personalityScores.' });
    }

    try {
        const result = await GroqAI.analyzeWithPersonality(resumeText, job, personalityScores);
        return res.status(200).json(result);
    } catch (e) {
        console.error("Error in analyzeCandidateAI endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
