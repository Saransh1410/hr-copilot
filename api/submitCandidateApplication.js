const { db } = require('./utils/db');
const Scoring = require('./utils/scoring');

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

    const { recruiterUid, jobId, candidateData } = req.body;
    if (!recruiterUid || !jobId || !candidateData) {
        return res.status(400).json({ error: 'Missing recruiterUid, jobId, or candidateData.' });
    }

    const { name, email, phone, resumeText, fileName } = candidateData;
    if (!name || !email || !resumeText) {
        return res.status(400).json({ error: 'Missing candidate name, email, or resumeText.' });
    }

    try {
        // 1. Fetch Job Description
        const jobsSnap = await db.collection('users').doc(recruiterUid).collection('appData').doc('jobs').get();
        if (!jobsSnap.exists) {
            return res.status(404).json({ error: 'Recruiter jobs collection not found.' });
        }
        const jobs = jobsSnap.data().value || [];
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job position not found.' });
        }

        // 2. Perform Scoring on Backend
        const atsResult = Scoring.atsScore(resumeText, job);
        const skillsResult = Scoring.skillsScore(resumeText, job);

        const tags = [];
        skillsResult.mustHave.forEach(s => {
            tags.push({
                text: (s.found ? '✅ ' : '⚠️ ') + s.skill,
                type: s.found ? 'tag-green' : 'tag-yellow'
            });
        });

        const candId = 'cand_' + Date.now();

        // 3. Prepare Candidate Object
        const candidate = {
            id: candId, name, email, phone, jobId, jobTitle: job.title,
            resumeText, fileName, created: Date.now(), stage: 'applied',
            atsScore: atsResult.score, atsDetails: atsResult.details,
            skillsScore: skillsResult.score, skillsDetails: skillsResult,
            personalityScores: null, personalityDone: false,
            aiScore: null, aiAnalysis: null,
            finalScore: null, tags,
            timeline: [
                { date: Date.now(), stage: 'applied', label: 'Application Submitted', icon: '📝' }
            ],
            notes: [],
            status: 'applied'
        };

        // 4. Load & Append to Candidates Array
        const candsRef = db.collection('users').doc(recruiterUid).collection('appData').doc('candidates');
        const candsSnap = await candsRef.get();
        const candidates = candsSnap.exists ? (candsSnap.data().value || []) : [];
        
        candidates.push(candidate);
        await candsRef.set({ value: candidates });

        return res.status(200).json({ success: true, candidateId: candId });
    } catch (e) {
        console.error("Error in submitCandidateApplication endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
