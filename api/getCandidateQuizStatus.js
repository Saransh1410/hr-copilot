const { db } = require('./utils/db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { recruiterUid, candidateId } = req.body;
    if (!recruiterUid || !candidateId) {
        return res.status(400).json({ error: 'Missing recruiterUid or candidateId.' });
    }

    try {
        const candsSnap = await db.collection('users').doc(recruiterUid).collection('appData').doc('candidates').get();
        if (!candsSnap.exists) {
            return res.status(200).json({ exists: false });
        }
        
        const cands = candsSnap.data().value || [];
        const cand = cands.find(c => c.id === candidateId);
        
        return res.status(200).json({
            exists: !!cand,
            timeSlot: cand ? cand.timeSlot : null,
            name: cand ? cand.name : '',
            jobId: cand ? cand.jobId : null
        });
    } catch (e) {
        console.error("Error in getCandidateQuizStatus endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
