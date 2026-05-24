/* data.js — Constants, Mock Data, and Firebase Store */

const firebaseConfig = {
  apiKey: "AIzaSyCn_lREvGE2n1JL1M22MZjzi767zrZyfWo",
  authDomain: "hr-copilot-61b7b.firebaseapp.com",
  projectId: "hr-copilot-61b7b",
  storageBucket: "hr-copilot-61b7b.firebasestorage.app",
  messagingSenderId: "778251723619",
  appId: "1:778251723619:web:4d6bac02ebb15079d2e956"
};

if (window.firebase && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = window.firebase ? firebase.firestore() : null;
const auth = window.firebase ? firebase.auth() : null;

const APP_VERSION = '1.9.0';

const CONFIG = {
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    GROQ_URL: 'https://api.groq.com/openai/v1/chat/completions',
    EMAILJS_SERVICE: 'service_oqhffgp',
    EMAILJS_KEY: 'LiW918Q7QD1kTMBsq',
    EMAILJS_TEMPLATE_APP: 'template_6erl8j5', // Application Completion
    EMAILJS_TEMPLATE_INT: 'template_vojci9b', // Interview Scheduling
    SCORE_WEIGHTS: { ats: 0.20, skills: 0.35, personality: 0.25, ai: 0.20 }
};

const ATS_SECTIONS = ['contact','summary','experience','education','skills'];
const ACTION_VERBS = ['achieved','built','created','designed','developed','drove','enhanced','established','executed','generated','implemented','improved','increased','launched','led','managed','negotiated','optimized','orchestrated','pioneered','reduced','resolved','scaled','streamlined','transformed'];

const QUIZ_QUESTIONS = [
    // Openness (5)
    {d:'openness',q:'When faced with a completely new problem at work, I:',o:[{t:'Eagerly explore unconventional approaches',s:5},{t:'Research best practices first, then adapt',s:4},{t:'Follow established procedures with minor tweaks',s:2},{t:'Stick to what has worked before',s:1}]},
    {d:'openness',q:'My ideal work environment offers:',o:[{t:'Constant change and new challenges',s:5},{t:'A mix of routine and creative projects',s:4},{t:'Structured work with occasional innovation',s:2},{t:'Clear, predictable daily tasks',s:1}]},
    {d:'openness',q:'When a colleague proposes an unusual idea, I typically:',o:[{t:'Get excited and brainstorm to build on it',s:5},{t:'Consider it carefully before responding',s:4},{t:'Point out potential risks first',s:2},{t:'Prefer to stick with proven methods',s:1}]},
    {d:'openness',q:'I learn new skills:',o:[{t:'Constantly — I\'m always picking up something new',s:5},{t:'When my role requires it',s:3},{t:'Only when absolutely necessary',s:1},{t:'I prefer to deepen existing expertise',s:2}]},
    {d:'openness',q:'How do you feel about ambiguity in project requirements?',o:[{t:'I thrive in it — it\'s a chance to shape the outcome',s:5},{t:'I can manage it with some discomfort',s:3},{t:'I prefer clarity but can adapt',s:2},{t:'I find it stressful and unproductive',s:1}]},
    // Conscientiousness (5)
    {d:'conscientiousness',q:'When managing multiple deadlines, I:',o:[{t:'Create detailed plans and track everything meticulously',s:5},{t:'Keep a general list and prioritize daily',s:4},{t:'Handle things as they come up',s:2},{t:'Often find myself rushing at the last minute',s:1}]},
    {d:'conscientiousness',q:'My workspace (physical or digital) is:',o:[{t:'Highly organized with a system for everything',s:5},{t:'Generally tidy with occasional clutter',s:3},{t:'A bit messy but I know where things are',s:2},{t:'Often disorganized',s:1}]},
    {d:'conscientiousness',q:'When I commit to a task, I:',o:[{t:'See it through no matter what, even beyond expectations',s:5},{t:'Complete it reliably to the required standard',s:4},{t:'Finish it but may cut corners if pressed',s:2},{t:'Sometimes lose focus and need reminders',s:1}]},
    {d:'conscientiousness',q:'How do you approach quality checks in your work?',o:[{t:'I review everything multiple times before submitting',s:5},{t:'I do one thorough review',s:4},{t:'I spot-check the important parts',s:2},{t:'I trust my first draft is usually good enough',s:1}]},
    {d:'conscientiousness',q:'When given a long-term goal with no immediate deadline:',o:[{t:'I create milestones and work on it consistently',s:5},{t:'I plan loosely and make steady progress',s:4},{t:'I tend to procrastinate until urgency builds',s:2},{t:'I struggle without external deadlines',s:1}]},
    // Extraversion (5)
    {d:'extraversion',q:'In team meetings, I usually:',o:[{t:'Lead discussions and share ideas energetically',s:5},{t:'Contribute actively when I have something to add',s:4},{t:'Listen more than I speak',s:2},{t:'Prefer to share thoughts in writing afterward',s:1}]},
    {d:'extraversion',q:'After a long day of social interaction at work, I feel:',o:[{t:'Energized and ready for more',s:5},{t:'Satisfied but need some quiet time',s:3},{t:'Quite drained and need alone time',s:1},{t:'It depends on the quality of interactions',s:3}]},
    {d:'extraversion',q:'When networking at professional events, I:',o:[{t:'Approach strangers easily and enjoy it',s:5},{t:'Talk to a few people and make meaningful connections',s:4},{t:'Stick with people I already know',s:2},{t:'Find it uncomfortable and avoid when possible',s:1}]},
    {d:'extraversion',q:'My preferred work style is:',o:[{t:'Collaborative — I do my best work with others',s:5},{t:'A mix of team and independent work',s:3},{t:'Mostly independent with team check-ins',s:2},{t:'Fully independent',s:1}]},
    {d:'extraversion',q:'When presenting to a group, I feel:',o:[{t:'Confident and excited — I love it',s:5},{t:'Comfortable after preparation',s:4},{t:'Nervous but I manage',s:2},{t:'Very anxious — I avoid it when possible',s:1}]},
    // Agreeableness (5)
    {d:'agreeableness',q:'When a colleague makes a mistake that affects my work, I:',o:[{t:'Help them fix it without making a fuss',s:5},{t:'Address it calmly and offer support',s:4},{t:'Point out the mistake and expect them to fix it',s:2},{t:'Express frustration and escalate if needed',s:1}]},
    {d:'agreeableness',q:'In a team disagreement, I tend to:',o:[{t:'Mediate and find a compromise everyone accepts',s:5},{t:'Listen to all sides and offer balanced input',s:4},{t:'Advocate firmly for what I believe is right',s:2},{t:'Push for my solution if I\'m sure it\'s best',s:1}]},
    {d:'agreeableness',q:'When asked to help with something outside my role:',o:[{t:'I always say yes — teamwork matters most',s:5},{t:'I help if I can without sacrificing my priorities',s:4},{t:'I help but set clear boundaries',s:2},{t:'I decline — it\'s not my responsibility',s:1}]},
    {d:'agreeableness',q:'How do you handle receiving critical feedback?',o:[{t:'I appreciate it and use it to improve immediately',s:5},{t:'I take it professionally and reflect on it',s:4},{t:'I accept it but may feel defensive initially',s:2},{t:'I find it difficult and often disagree',s:1}]},
    {d:'agreeableness',q:'When a new team member joins, I:',o:[{t:'Proactively welcome them and offer mentorship',s:5},{t:'Introduce myself and offer help if they need it',s:4},{t:'Wait for them to reach out',s:2},{t:'Focus on my own work and let HR handle onboarding',s:1}]},
    // Emotional Stability (5)
    {d:'emotional_stability',q:'When facing an unexpected crisis at work, I:',o:[{t:'Stay calm and immediately start problem-solving',s:5},{t:'Feel initial stress but quickly regain composure',s:4},{t:'Feel anxious but push through',s:2},{t:'Get overwhelmed and struggle to focus',s:1}]},
    {d:'emotional_stability',q:'After receiving negative feedback on a project, I:',o:[{t:'View it as a learning opportunity and move forward',s:5},{t:'Feel disappointed briefly but recover quickly',s:4},{t:'Dwell on it for a while before moving on',s:2},{t:'Take it personally and it affects my mood for days',s:1}]},
    {d:'emotional_stability',q:'When work pressure increases significantly, I:',o:[{t:'Thrive — pressure brings out my best work',s:5},{t:'Manage well with good planning',s:4},{t:'Cope but feel stressed',s:2},{t:'Struggle with anxiety and performance drops',s:1}]},
    {d:'emotional_stability',q:'How often do work-related worries affect your personal life?',o:[{t:'Rarely — I separate work and personal life well',s:5},{t:'Occasionally, but I manage it',s:3},{t:'Frequently — I find it hard to switch off',s:2},{t:'Constantly — work stress follows me everywhere',s:1}]},
    {d:'emotional_stability',q:'When multiple things go wrong simultaneously, I:',o:[{t:'Prioritize calmly and tackle one thing at a time',s:5},{t:'Feel stressed but maintain productivity',s:4},{t:'Become flustered and less effective',s:2},{t:'Feel paralyzed and need support to proceed',s:1}]},
    // Culture Fit (5)
    {d:'culture_fit',q:'What motivates you most in a job?',o:[{t:'Making a meaningful impact and growing',s:5},{t:'Financial rewards and stability',s:3},{t:'Work-life balance above all',s:2},{t:'Status and recognition',s:1}]},
    {d:'culture_fit',q:'How important is work-life balance to you?',o:[{t:'Important, but I\'m flexible when the team needs me',s:5},{t:'Critical — I maintain strict boundaries',s:3},{t:'I don\'t mind working extra if I\'m passionate',s:4},{t:'I work to live, not live to work',s:2}]},
    {d:'culture_fit',q:'Your ideal manager:',o:[{t:'Gives autonomy and trusts me to deliver',s:5},{t:'Provides clear direction with regular check-ins',s:4},{t:'Is hands-on and closely involved',s:2},{t:'Leaves me completely alone',s:1}]},
    {d:'culture_fit',q:'How do you feel about company social events?',o:[{t:'Love them — they build team bonds',s:5},{t:'Enjoy them occasionally',s:3},{t:'Attend when expected but prefer not to',s:2},{t:'Avoid them — work relationships should stay professional',s:1}]},
    {d:'culture_fit',q:'When it comes to rules and processes at work:',o:[{t:'I respect them but suggest improvements when needed',s:5},{t:'I follow them strictly',s:3},{t:'I bend them when it makes sense',s:4},{t:'I find them restrictive and prefer freedom',s:1}]}
];

const DIMENSION_LABELS = {
    openness:'Openness',conscientiousness:'Conscientiousness',extraversion:'Extraversion',
    agreeableness:'Agreeableness',emotional_stability:'Emotional Stability',culture_fit:'Culture Fit'
};

const BADGE_TIERS = [
    {min:85,label:'🏆 EXCELLENT CANDIDATE',cls:'badge-excellent'},
    {min:70,label:'🥈 STRONG CANDIDATE',cls:'badge-strong'},
    {min:0, label:'⚠️ WEAK CANDIDATE',cls:'badge-weak'}
];

function getBadge(score){return BADGE_TIERS.find(b=>score>=b.min)}

const SAMPLE_JOBS = [
    {id:'job_1',title:'Senior Python Developer',department:'Engineering',location:'Remote',type:'Full-time',
     mustHave:['Python','Django','PostgreSQL','REST APIs','Git'],
     niceToHave:['AWS','Docker','Kubernetes','Redis','CI/CD'],
     minYears:4,education:'Bachelor\'s',description:'Looking for a senior Python developer to lead backend development.',
     cultureValues:['innovation','autonomy','collaboration'],created:Date.now(),status:'active',candidates:[]},
    {id:'job_2',title:'Product Manager',department:'Product',location:'Hybrid',type:'Full-time',
     mustHave:['Product Strategy','Agile','Stakeholder Management','Data Analysis','Roadmapping'],
     niceToHave:['SQL','Figma','A/B Testing','Market Research'],
     minYears:3,education:'Bachelor\'s',description:'Seeking a product manager to drive our core platform.',
     cultureValues:['leadership','communication','impact'],created:Date.now(),status:'active',candidates:[]}
];

/* Storage helpers */
const syncKeys = ['jobs', 'candidates', 'interviews', 'quizResults', 'onboarding', 'settings'];

const Store = {
    cache: {},
    uid: null,
    
    sanitizeCandidates(cands) {
        if (!Array.isArray(cands)) return;
        cands.forEach(c => {
            if (!c.status) c.status = c.stage || 'applied';
            if (!c.stage) c.stage = c.status;
            if (!c.timeline || !Array.isArray(c.timeline)) {
                c.timeline = [
                    { date: c.created || Date.now(), stage: 'applied', label: 'Application Submitted', icon: '📝' }
                ];
                if (c.personalityDone) {
                    c.timeline.push({ date: (c.created || Date.now()) + 60000, stage: 'screening', label: 'Assessment Completed', icon: '🧠' });
                }
            }
            if (!c.notes || !Array.isArray(c.notes)) c.notes = [];
            if (!c.tags || !Array.isArray(c.tags)) c.tags = [];
        });
    },
    
    async init(uid) {
        if (!db || !uid) return Promise.resolve();
        this.uid = uid;
        this.cache = {}; // Clear cache on new init
        
        const promises = syncKeys.map(key => {
            return new Promise(resolve => {
                let first = true;
                const docRef = db.collection('users').doc(uid).collection('appData').doc(key);
                
                docRef.onSnapshot(doc => {
                    const cacheKey = this.uid + '_' + key;
                    if (doc.exists) {
                        const data = doc.data().value;
                        this.cache[cacheKey] = data;
                        localStorage.setItem('hr_' + cacheKey, JSON.stringify(data));
                        if (this.onChange) this.onChange(key, data);
                        
                        if (window.App && App.currentPage && App.currentPage !== 'setup') {
                            const active = document.activeElement;
                            const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
                            if (!isTyping) App.renderPage(App.currentPage);
                        }
                    } else {
                        // If no cloud data, try to migration from old global local storage or start fresh
                        const oldLocal = localStorage.getItem('hr_' + key);
                        if (oldLocal) {
                            try {
                                const data = JSON.parse(oldLocal);
                                this.set(key, data);
                                localStorage.removeItem('hr_' + key); // Clean up
                            } catch(e) { console.error("Migration error", e); }
                        } else {
                            // Check if we already have UID-scoped local data
                            const localData = localStorage.getItem('hr_' + cacheKey);
                            if (!localData) {
                                this.set(key, key === 'settings' ? {} : []);
                            } else {
                                try { this.cache[cacheKey] = JSON.parse(localData); } catch(e) {}
                            }
                        }
                    }
                    if (first) { first = false; resolve(); }
                }, err => {
                    console.warn(`Store: Snapshot read restricted for ${key} (Expected on public portal)`);
                    resolve();
                });
            });
        });
        return Promise.all(promises);
    },

    get(key, def) {
        const cacheKey = this.uid ? this.uid + '_' + key : key;
        if (this.cache[cacheKey] !== undefined && this.cache[cacheKey] !== null) {
            let val = this.cache[cacheKey];
            if (key === 'candidates') this.sanitizeCandidates(val);
            return val;
        }
        try { 
            const v = localStorage.getItem('hr_' + cacheKey); 
            let parsed = v ? JSON.parse(v) : def; 
            if (parsed === null) parsed = def;
            if (key === 'candidates') this.sanitizeCandidates(parsed);
            this.cache[cacheKey] = parsed;
            return parsed;
        }
        catch { return def; }
    },
    
    set(key, val) {
        const cacheKey = this.uid ? this.uid + '_' + key : key;
        this.cache[cacheKey] = val;
        localStorage.setItem('hr_' + cacheKey, JSON.stringify(val));
        if (db && this.uid && syncKeys.includes(key)) {
            db.collection('users').doc(this.uid).collection('appData').doc(key).set({ value: val }).catch(err => console.error("Firebase sync error:", err));
        }
        if (this.onChange) this.onChange(key, val);
    },
    
    clear() {
        this.uid = null;
        this.cache = {};
    },
    
    remove(k) {
        const cacheKey = this.uid ? this.uid + '_' + key : k;
        localStorage.removeItem('hr_' + cacheKey);
        delete this.cache[cacheKey];
    },
    
    getAll() {
        return {
            jobs: this.get('jobs', []),
            candidates: this.get('candidates', []),
            interviews: this.get('interviews', []),
            onboarding: this.get('onboarding', []),
            settings: this.get('settings', {}),
            quizResults: this.get('quizResults', [])
        };
    },
    exportAll() { return JSON.stringify(this.getAll(), null, 2); },
    importAll(json) {
        try {
            const d = JSON.parse(json);
            Object.keys(d).forEach(k => this.set(k, d[k]));
        } catch(e) { console.error("Import error", e); }
    }
};

/* Init data if empty */
function initSampleData(forceSample = false){
    if(!Store.get('jobs')){Store.set('jobs', [])}
    if(!Store.get('candidates')){Store.set('candidates',[])}
    if(!Store.get('interviews')){Store.set('interviews',[])}
    if(!Store.get('onboarding')){Store.set('onboarding',[])}
}

// Start cloud sync
// Global sync moved to App.onAuthSuccess
// Store.init();
