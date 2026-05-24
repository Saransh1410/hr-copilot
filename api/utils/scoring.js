/* scoring.js — ATS, Skills Match, and composite scoring engines (Backend-side) */

const ATS_SECTIONS = ['contact','summary','experience','education','skills'];
const ACTION_VERBS = [
    'achieved','built','created','designed','developed','drove','enhanced','established','executed','generated',
    'implemented','improved','increased','launched','led','managed','negotiated','optimized','orchestrated',
    'pioneered','reduced','resolved','scaled','streamlined','transformed'
];

const Scoring = {
    /* ── ATS Score (20%) ── */
    atsScore(resumeText, job) {
        if (!resumeText || resumeText.length < 50) return { score: 0, details: [] };

        const text = resumeText.toLowerCase();
        
        // Anti-spam / Random Document Check
        const resumeKeywords = ['experience', 'education', 'skills', 'work', 'project', 'degree', 'university', 'role'];
        const isResume = resumeKeywords.some(k => text.includes(k));
        if (!isResume) {
            return { score: 0, details: [{ label: 'Invalid Document', pts: 0, max: 100, found: 'No resume keywords found' }] };
        }

        let score = 0; const details = [];
        const words = text.split(/\s+/);
        // 1. Section detection (20 pts)
        let sectionsFound = 0;
        ATS_SECTIONS.forEach(s => {
            const patterns = {
                contact: /email|phone|address|linkedin/i,
                summary: /summary|objective|profile|about/i,
                experience: /experience|employment|work history/i,
                education: /education|degree|university|college/i,
                skills: /skills|technologies|proficiencies|competencies/i
            };
            if (patterns[s] && patterns[s].test(resumeText)) { sectionsFound++; }
        });
        const sectionPts = Math.round((sectionsFound / ATS_SECTIONS.length) * 20);
        score += sectionPts;
        details.push({ label: 'Section Detection', pts: sectionPts, max: 20, found: sectionsFound + '/' + ATS_SECTIONS.length });

        // 2. Keyword density vs job (25 pts)
        const allKeywords = [...(job.mustHave || []), ...(job.niceToHave || [])];
        let kwFound = 0;
        allKeywords.forEach(kw => { if (text.includes(kw.toLowerCase())) kwFound++; });
        const kwPts = allKeywords.length > 0 ? Math.round((kwFound / allKeywords.length) * 25) : 12;
        score += kwPts;
        details.push({ label: 'Keyword Match', pts: kwPts, max: 25, found: kwFound + '/' + allKeywords.length });

        // 3. Action verbs (15 pts)
        let verbCount = 0;
        ACTION_VERBS.forEach(v => { if (text.includes(v)) verbCount++; });
        const verbPts = Math.min(15, Math.round((verbCount / 8) * 15));
        score += verbPts;
        details.push({ label: 'Action Verbs', pts: verbPts, max: 15, found: verbCount });

        // 4. Quantified achievements (15 pts)
        const numbers = text.match(/\d+%|\$[\d,]+|\d+\+?\s*(years|clients|projects|users|team)/gi) || [];
        const quantPts = Math.min(15, numbers.length * 3);
        score += quantPts;
        details.push({ label: 'Quantified Results', pts: quantPts, max: 15, found: numbers.length });

        // 5. Length & readability (15 pts)
        let lengthPts = 0;
        if (words.length >= 200 && words.length <= 900) lengthPts = 15;
        else if (words.length >= 100 && words.length <= 1200) lengthPts = 10;
        else if (words.length >= 50) lengthPts = 5;
        score += lengthPts;
        details.push({ label: 'Length/Readability', pts: lengthPts, max: 15, info: words.length + ' words' });

        // 6. Contact info (10 pts)
        let contactPts = 0;
        if (/[\w.-]+@[\w.-]+\.\w+/.test(resumeText)) contactPts += 4;
        if (/\+?\d[\d\s()-]{7,}/.test(resumeText)) contactPts += 3;
        if (/linkedin/i.test(resumeText)) contactPts += 3;
        score += contactPts;
        details.push({ label: 'Contact Info', pts: contactPts, max: 10 });

        return { score: Math.min(100, score), details };
    },

    /* ── Skills Match Score (35%) ── */
    skillsScore(resumeText, job) {
        const text = resumeText.toLowerCase();
        const mustHave = job.mustHave || [];
        const niceToHave = job.niceToHave || [];
        // Must-have: 60% of skills score
        let mustCount = 0;
        const mustResults = mustHave.map(skill => {
            const found = text.includes(skill.toLowerCase());
            if (found) mustCount++;
            return { skill, found };
        });
        const mustScore = mustHave.length > 0 ? (mustCount / mustHave.length) * 60 : 30;
        // Nice-to-have: 20% of skills score
        let niceCount = 0;
        const niceResults = niceToHave.map(skill => {
            const found = text.includes(skill.toLowerCase());
            if (found) niceCount++;
            return { skill, found };
        });
        const niceScore = niceToHave.length > 0 ? (niceCount / niceToHave.length) * 20 : 10;
        // Years of experience: 10%
        const yrMatch = resumeText.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
        const yrsFound = yrMatch ? parseInt(yrMatch[1]) : 0;
        const yrScore = yrsFound >= (job.minYears || 0) ? 10 : Math.round((yrsFound / Math.max(1, job.minYears)) * 10);
        // Education: 10%
        const eduLevels = { 'phd': 5, 'doctorate': 5, 'master': 4, 'mba': 4, 'bachelor': 3, 'associate': 2, 'diploma': 1 };
        let eduFound = 0;
        Object.entries(eduLevels).forEach(([k, v]) => { if (text.includes(k)) eduFound = Math.max(eduFound, v); });
        const reqLevel = eduLevels[(job.education || '').toLowerCase()] || 3;
        const eduScore = eduFound >= reqLevel ? 10 : Math.round((eduFound / reqLevel) * 10);

        const total = Math.min(100, Math.round(mustScore + niceScore + yrScore + eduScore));
        return { score: total, mustHave: mustResults, niceToHave: niceResults, yearsFound: yrsFound, yearsRequired: job.minYears, eduScore };
    },

    /* ── Composite Score ── */
    compositeScore(ats, skills, personality, ai) {
        // Default weights: ats: 0.20, skills: 0.35, personality: 0.25, ai: 0.20
        return Math.round(
            (ats || 0) * 0.20 +
            (skills || 0) * 0.35 +
            (personality || 0) * 0.25 +
            (ai || 0) * 0.20
        );
    },

    /* ── Extract candidate name from resume ── */
    extractName(text, fallbackName = 'Unnamed Candidate') {
        const lines = text.trim().split('\n').filter(l => l.trim());
        for (const line of lines.slice(0, 5)) {
            const clean = line.trim();
            if (clean.length > 2 && clean.length < 50 && /^[A-Z][a-z]/.test(clean) && !/[@|]/.test(clean) && !/\d{3}/.test(clean)) {
                return clean.split(/\s+/).slice(0, 3).join(' ');
            }
        }
        return fallbackName;
    },

    extractEmail(text) {
        if (!text) return '';
        const standardMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (standardMatch) return standardMatch[0];
        const cleaned = text.replace(/\s+/g, '');
        const cleanMatch = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return cleanMatch ? cleanMatch[0] : '';
    },

    extractPhone(text) {
        const m = text.match(/\+?\d[\d\s()-]{7,}\d/);
        return m ? m[0].trim() : '';
    }
};

module.exports = Scoring;
