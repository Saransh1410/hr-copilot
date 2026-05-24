const { verifyAuth } = require('./utils/auth');
const Scoring = require('./utils/scoring');

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
    if (!decodedToken) return; // verifyAuth already handled 401 response

    const { resumeText, job } = req.body;
    if (!resumeText || !job) {
        return res.status(400).json({ error: 'Missing resumeText or job details.' });
    }

    try {
        const result = Scoring.atsScore(resumeText, job);
        return res.status(200).json(result);
    } catch (e) {
        console.error("Error in scoreCandidateATS endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
