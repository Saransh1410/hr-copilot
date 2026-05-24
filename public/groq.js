/* groq.js — Client-side wrappers for Vercel Serverless Functions */
const GroqAI = {
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

    async scoreCandidate(resumeText, job) {
        return this.callFunction('scoreCandidateAI', { resumeText, job });
    },

    async analyzeWithPersonality(resumeText, job, personalityScores) {
        return this.callFunction('analyzeCandidateAI', { resumeText, job, personalityScores });
    },

    async generateInterviewQuestions(job, candidate) {
        return this.callFunction('generateInterviewQuestionsAI', { job, candidate });
    },

    async chat(history) {
        const res = await this.callFunction('chatWithCopilotAI', { history });
        return res.reply;
    }
};
