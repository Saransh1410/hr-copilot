/* groq.js — Backend Groq API Integration */
const axios = require('axios');

const CONFIG = {
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    GROQ_URL: 'https://api.groq.com/openai/v1/chat/completions'
};

const DIMENSION_LABELS = {
    openness:'Openness',conscientiousness:'Conscientiousness',extraversion:'Extraversion',
    agreeableness:'Agreeableness',emotional_stability:'Emotional Stability',culture_fit:'Culture Fit'
};

const GroqAI = {
    async call(messages, temperature = 0.7) {
        const key = process.env.GROQ_API_KEY;
        if (!key) {
            console.error("Groq Backend Error: process.env.GROQ_API_KEY is not configured");
            throw new Error('Groq API Key not configured on the backend.');
        }

        try {
            const response = await axios.post(CONFIG.GROQ_URL, {
                model: CONFIG.GROQ_MODEL,
                messages,
                temperature,
                max_tokens: 2048
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                }
            });

            if (response.data && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error("Invalid response format from Groq API");
            }
        } catch (err) {
            console.error("Groq Backend Call Error:", err.response ? err.response.data : err.message);
            const status = err.response ? err.response.status : 500;
            if (status === 401) {
                throw new Error('Invalid Groq API Key.');
            }
            if (status === 429) {
                throw new Error('Groq rate limit exceeded. Please wait a minute before retrying.');
            }
            throw new Error(`Groq API error: ${err.message}`);
        }
    },

    async scoreCandidate(resumeText, job) {
        const prompt = `You are an expert HR analyst. Analyze this resume against the job requirements and provide a JSON response.

JOB: ${job.title}
MUST-HAVE SKILLS: ${(job.mustHave || []).join(', ')}
NICE-TO-HAVE SKILLS: ${(job.niceToHave||[]).join(', ')}
MIN YEARS EXPERIENCE: ${job.minYears}
EDUCATION: ${job.education}

RESUME TEXT:
${resumeText.substring(0, 3000)}

CRITICAL RULES:
1. If the text appears to be completely random garbage, a blank document, an excerpt from a book, or completely unrelated to a resume, you MUST give a score of 0, state "Invalid Document" in the summary, and recommend "Do Not Recommend".
2. Be brutally honest. Do not invent strengths if the text is garbage.

Respond ONLY with valid JSON:
{
  "score": <0-100 holistic score>,
  "summary": "<2-3 sentence assessment>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "redFlags": ["<flag1>"] or [],
  "skillsFound": ["<skill1>", "<skill2>"],
  "yearsExperience": <number>,
  "educationLevel": "<level>",
  "recommendation": "<Recommend for Interview|Consider with Reservations|Do Not Recommend>",
  "interviewQuestions": ["<q1>", "<q2>", "<q3>"]
}`;

        const raw = await this.call([{ role: 'user', content: prompt }], 0.3);
        try {
            return JSON.parse(raw.replace(/```json?\n?/g,'').replace(/```/g,'').trim());
        } catch (err) {
            console.warn("Groq JSON Parse Fail, raw response:", raw);
            return {
                score: 50,
                summary: raw.substring(0, 200),
                strengths: [],
                redFlags: ['Could not parse AI response'],
                skillsFound: [],
                yearsExperience: 0,
                educationLevel: 'Unknown',
                recommendation: 'Consider with Reservations',
                interviewQuestions: []
            };
        }
    },

    async analyzeWithPersonality(resumeText, job, personalityScores) {
        const prompt = `You are a world-class HR consultant. Perform a deep, three-part evaluation of this candidate.
        
JOB TITLE: ${job.title}
MUST HAVE: ${(job.mustHave || []).join(', ')}

RESUME (excerpt): 
${resumeText.substring(0, 2500)}

PERSONALITY ASSESSMENT SCORES (out of 100):
${Object.entries(personalityScores).filter(([k])=>k!=='_overall').map(([k,v])=>`- ${DIMENSION_LABELS[k]||k}: ${v}`).join('\n')}

Provide a JSON response with exactly this structure:
{
  "technical": {
    "score": <0-100>,
    "summary": "<2 sentences focused ONLY on skills and experience match>",
    "strengths": ["<technical strength1>", "<technical strength2>"]
  },
  "behavioral": {
    "score": <0-100>,
    "summary": "<2 sentences focused ONLY on personality assessment results>",
    "traits": ["<dominant trait1>", "<dominant trait2>"]
  },
  "composite": {
    "score": <0-100 overall weight>,
    "narrative": "<3 sentences on how their personality affects their technical potential. Be blunt.>",
    "verdict": "<Strong Hire | Solid Contributor | High Risk | Do Not Hire>",
    "tailoredQuestions": ["<q1>", "<q2>"]
  }
}`;

        const raw = await this.call([{ role: 'user', content: prompt }], 0.4);
        try {
            return JSON.parse(raw.replace(/```json?\n?/g,'').replace(/```/g,'').trim());
        } catch (err) {
            console.warn("Groq Personality JSON Parse Fail, raw response:", raw);
            return { 
                technical: { score: 50, summary: 'Error parsing AI response', strengths: [] },
                behavioral: { score: 50, summary: '', traits: [] },
                composite: { score: 50, narrative: raw.substring(0,300), verdict: 'Review Required', tailoredQuestions: [] }
            }; 
        }
    },

    async generateInterviewQuestions(job, candidate) {
        const prompt = `Generate 8 interview questions for a ${job.title} candidate. Mix behavioral, technical, and situational questions. Consider their profile: ${candidate.aiAnalysis?.summary || 'No prior analysis'}.
Return JSON array: ["question1","question2",...]`;
        const raw = await this.call([{ role: 'user', content: prompt }], 0.6);
        try {
            return JSON.parse(raw.replace(/```json?\n?/g,'').replace(/```/g,'').trim());
        } catch (err) {
            return ['Tell me about yourself.','Why are you interested in this role?','Describe a challenging project.'];
        }
    },

    async chat(history, jobs = [], cands = [], ints = []) {
        const context = `You are the AI Copilot for this HR platform.
CURRENT REAL-TIME DATA:
- Active Jobs: ${jobs.length} (${jobs.map(j=>j.title).join(', ')})
- Total Candidates: ${cands.length} (${cands.map(c=>`${c.name} - ${c.jobTitle} - Score: ${c.finalScore||'Pending'}`).join(', ')})
- Upcoming Interviews: ${ints.length} scheduled.
Always reference this data when asked about current state. Keep responses concise and helpful.`;

        const messages = [{ role: 'system', content: context }, ...history];
        const raw = await this.call(messages, 0.7);
        return raw;
    }
};

module.exports = GroqAI;
