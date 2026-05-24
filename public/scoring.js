/* scoring.js — Client-side wrappers for backend Firebase Cloud Functions & PDF Parser */
const Scoring = {
    async callFunction(name, data) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (window.firebase && firebase.auth && firebase.auth().currentUser) {
                const token = await firebase.auth().currentUser.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/' + name, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Call error in ${name}:`, error);
            throw new Error(error.message || `Failed to execute backend service ${name}`);
        }
    },

    async atsScore(resumeText, job) {
        return this.callFunction('scoreCandidateATS', { resumeText, job });
    },

    async skillsScore(resumeText, job) {
        return this.callFunction('scoreCandidateSkills', { resumeText, job });
    },

    compositeScore(ats, skills, personality, ai) {
        // Keep this local as a simple synchronous calculation for rendering
        const w = CONFIG.SCORE_WEIGHTS;
        return Math.round(
            (ats || 0) * w.ats +
            (skills || 0) * w.skills +
            (personality || 0) * w.personality +
            (ai || 0) * w.ai
        );
    },

    /* ── Parse resume text from PDF (runs client-side) ── */
    async parsePDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text;
    },

    /* ── Extract candidate info (runs client-side for rapid UI feedback) ── */
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
