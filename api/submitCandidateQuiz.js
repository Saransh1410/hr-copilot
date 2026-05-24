const { db } = require('./utils/db');
const Scoring = require('./utils/scoring');
const GroqAI = require('./utils/groq');

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

    const { recruiterUid, candidateId, scores, answers, jobId } = req.body;
    if (!recruiterUid || !candidateId || !scores || !answers || !jobId) {
        return res.status(400).json({ error: 'Missing required fields: recruiterUid, candidateId, scores, answers, or jobId.' });
    }

    try {
        // 1. Fetch Candidate and Update details
        const candsRef = db.collection('users').doc(recruiterUid).collection('appData').doc('candidates');
        const candsSnap = await candsRef.get();
        if (!candsSnap.exists) {
            return res.status(404).json({ error: 'Candidates collection not found.' });
        }
        const candidates = candsSnap.data().value || [];
        const candIdx = candidates.findIndex(c => c.id === candidateId);
        if (candIdx === -1) {
            return res.status(404).json({ error: 'Candidate not found.' });
        }

        const c = candidates[candIdx];
        c.personalityScores = scores;
        c.personalityDone = true;
        c.quizLog = answers;

        // 2. Fetch Job details
        const jobsSnap = await db.collection('users').doc(recruiterUid).collection('appData').doc('jobs').get();
        const jobs = jobsSnap.exists ? (jobsSnap.data().value || []) : [];
        const job = jobs.find(j => j.id === jobId) || jobs[0] || { title: 'General', mustHave: [], niceToHave: [], minYears: 0, education: '' };

        // 3. Securely call Groq for personality multi-agent analysis
        try {
            const result = await GroqAI.analyzeWithPersonality(c.resumeText, job, scores);
            c.aiAnalysis = result;
            c.aiScore = result.composite ? result.composite.score : (result.holisticScore || result.score);
        } catch (e) {
            console.error("AI Analysis during quiz completion failed:", e);
            c.aiScore = 50;
            c.aiAnalysis = { error: e.message };
        }

        // 4. Calculate Final Score
        c.finalScore = Scoring.compositeScore(c.atsScore, c.skillsScore, c.personalityScores._overall || 0, c.aiScore);

        // 5. Update Timeline Logs
        if (!c.timeline) c.timeline = [];
        c.timeline.push({ date: Date.now(), stage: 'screening', label: 'Assessment Completed', icon: '🧠' });
        c.timeline.push({
            date: Date.now() + 1000,
            stage: c.status || 'applied',
            label: `AI Score generated: ${c.aiScore}/100. Verdict: ${c.aiAnalysis?.composite?.verdict || c.aiAnalysis?.verdict || 'Processed'}`,
            icon: '🤖'
        });

        // Save updated candidates back to Firestore
        await candsRef.set({ value: candidates });

        // 6. Save Quiz Result
        const quizRef = db.collection('users').doc(recruiterUid).collection('appData').doc('quizResults');
        const quizSnap = await quizRef.get();
        const quizResults = quizSnap.exists ? (quizSnap.data().value || []) : [];
        quizResults.push({ candidateId, jobId, scores, date: Date.now() });
        await quizRef.set({ value: quizResults });

        return res.status(200).json({ success: true });
    } catch (e) {
        console.error("Error in submitCandidateQuiz endpoint:", e);
        return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
};
