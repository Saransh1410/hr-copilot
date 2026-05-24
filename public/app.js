/* app.js — Main controller */
const App = {
    currentPage: 'dashboard',
    chatHistory: [],
    candidateViewMode: 'kanban',
    boot() {
        const lastVersion = localStorage.getItem('app_version');
        if (lastVersion !== APP_VERSION) {
            localStorage.clear(); // Wipe all stale cache
            localStorage.setItem('app_version', APP_VERSION);
            window.location.reload();
            return;
        }
        this.init();
    },
    init() {
        Store.onChange = (key, val) => {
            if (key === 'candidates') {
                this.syncDerivedCollections();
            }
        };

        // 1. Immediate UI check
        const isPortal = window.location.hash.startsWith('#apply-') || window.location.hash.startsWith('#quiz-');
        
        // Show Login UI immediately to prevent black screen while Auth resolves
        if (!isPortal) {
            this.showLogin();
        } else {
            this.handlePortalRoutes();
        }

        

        // Global Error Logger
        window.onerror = (m, u, l, c, e) => {
            console.error('System Error:', m, l, c, e);
            this.toast('Error: ' + m, 'error');
            return false;
        };

        const s = Store.get('settings', {});

        if (window.emailjs) {
            emailjs.init(s.emailKey || CONFIG.EMAILJS_KEY);
        }
        
        // Listen for Auth changes
        if (auth) {
            auth.onAuthStateChanged(user => {
                if (user) {
                    this.onAuthSuccess(user);
                } else {
                    this.user = null;
                    if (!isPortal) this.showLogin();
                }
            });
        } else {
            // No Firebase Auth available (local testing)
            if (!isPortal) this.navigate('dashboard');
        }
    },

    showLogin() {
        // Skip login if in a portal
        const isPortal = window.location.hash.startsWith('#apply-') || window.location.hash.startsWith('#quiz-');
        if (isPortal) {
            this.handlePortalRoutes();
            return;
        }

        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('setup-overlay').classList.add('hidden');
        document.getElementById('login-overlay').classList.remove('hidden');
        document.getElementById('login-container').innerHTML = Pages.login();
        document.getElementById('login-chatbot-fab').classList.remove('hidden');
    },

    async onAuthSuccess(user) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('login-chatbot-fab').classList.add('hidden');
        document.getElementById('login-chatbot-panel').classList.add('hidden');
        this.user = user;
        
        // Wait for per-user cloud sync
        await Store.init(user.uid);
        
        // Initial sync of derived collections
        this.syncDerivedCollections();
        
        // Check for hash route
        const isPortal = window.location.hash.startsWith('#apply-') || window.location.hash.startsWith('#quiz-');
        if (isPortal) {
            this.handlePortalRoutes();
            return;
        }

        let s = Store.get('settings', {});
        if (!s.companyName) {
            s = {
                companyName: 'Acme Corp',
                emailKey: CONFIG.EMAILJS_KEY,
                emailServiceId: CONFIG.EMAILJS_SERVICE,
                emailTemplateApp: CONFIG.EMAILJS_TEMPLATE_APP,
                emailTemplateInt: CONFIG.EMAILJS_TEMPLATE_INT,
                model: CONFIG.GROQ_MODEL,
                cultureValues: ['innovation', 'collaboration', 'autonomy']
            };
            Store.set('settings', s);
            this.toast('Account initialized with demo settings!', 'success');
        }

        document.getElementById('setup-overlay').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        this.updateCompanyName();
        if (this.currentPage === 'setup' || !this.currentPage || this.currentPage === 'dashboard') {
            this.navigate('dashboard');
        }
    },

    async handlePortalRoutes() {
        const hash = window.location.hash;
        if (!hash.startsWith('#apply-') && !hash.startsWith('#quiz-')) return;

        console.log("App: Handling Portal Route", hash);

        // Force hide everything else
        const container = document.getElementById('app-container');
        const login = document.getElementById('login-overlay');
        const setup = document.getElementById('setup-overlay');
        const portal = document.getElementById('page-portal');

        if (container) container.classList.add('hidden');
        if (login) login.classList.add('hidden');
        if (setup) setup.classList.add('hidden');
        
        if (portal) {
            portal.classList.add('active');
            portal.style.display = 'block';
            portal.innerHTML = `<div class="empty-state">
                <div class="animate-pulse" style="font-size:3rem;margin-bottom:1rem">🌐</div>
                <h2>Connecting to Portal...</h2>
                <p>Syncing job details from our cloud...</p>
            </div>`;
        }

        let id = '';
        if (hash.startsWith('#apply-')) {
            id = hash.replace('#apply-', '');
            this.currentPage = 'portal';
        } else if (hash.startsWith('#quiz-')) {
            id = hash.replace('#quiz-', '');
            this.currentPage = 'quiz-portal';
        }

        // Check if ID contains a UID scope (format: UID---ID)
        if (id.includes('---')) {
            const [uid, actualId] = id.split('---');
            console.log("App: Portal UID Scope detected:", uid);
            await Store.init(uid);
            id = actualId;
        }

        if (this.currentPage === 'portal') {
            this.currentJobId = id;
            
            // Legacy/Test Fallback: If job not found in current store, check sample jobs
            const jobs = Store.get('jobs', []);
            if (!jobs.find(j => j.id === id)) {
                const sampleJob = SAMPLE_JOBS.find(j => j.id === id);
                if (sampleJob) {
                    console.log("App: Job found in sample data fallback.");
                    const existing = Store.get('jobs', []);
                    Store.set('jobs', [...existing, sampleJob]);
                }
            }
            
            this.renderPage('portal');
        } else if (this.currentPage === 'quiz-portal') {
            if (!Quiz.state.active) {
                console.log("App: Starting Quiz for", id);
                Quiz.start(id, null, true);
            }
        }
    },

    // ── Auth Actions ──
    async signIn() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        if (!email || !pass) return this.toast('Fill all fields', 'error');
        try {
            await auth.signInWithEmailAndPassword(email, pass);
            this.toast('Welcome back!', 'success');
        } catch (e) { this.toast(e.message, 'error'); }
    },

    async signUp() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        if (!email || !pass) return this.toast('Fill all fields', 'error');
        try {
            await auth.createUserWithEmailAndPassword(email, pass);
            this.toast('Account created!', 'success');
        } catch (e) { this.toast(e.message, 'error'); }
    },

    async googleLogin() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
            this.toast('Signed in with Google', 'success');
        } catch (e) { this.toast(e.message, 'error'); }
    },

    showReset() {
        const container = document.getElementById('login-container');
        if (container) {
            container.innerHTML = Pages.resetView();
            // Ensure chatbot stays visible
            document.getElementById('login-chatbot-fab').classList.remove('hidden');
        }
    },


    async sendReset() {
        const email = document.getElementById('reset-email').value.trim();
        if (!email) return this.toast('Enter your email address first', 'warning');
        
        this.toast('Validating email and sending link...', 'info');
        try {
            await auth.sendPasswordResetEmail(email);
            const container = document.getElementById('login-container');
            if (container) container.innerHTML = Pages.resetSuccess(email);
        } catch (e) { 
            console.error("Reset Error:", e);
            let msg = e.message;
            if (e.code === 'auth/user-not-found') msg = "No account found with this email.";
            this.toast('Error: ' + msg, 'error'); 
        }
    },

    async forgotPassword() {
        // Legacy fallback
        this.showReset();
    },

    loginChat(topic) {
        const el = document.getElementById('login-chatbot-message');
        if (!el) return;
        const responses = {
            signin: 'Enter your email and password, then click <b>Sign In</b>. You can also use Google for instant access.',
            signup: 'New user? Enter your email and a secure password, then click <b>Sign Up</b> to create your account.',
            reset: 'Enter your email address in the field above, then click the <b>Forgot Password?</b> link next to the password field.',
            about: 'HR Copilot is an autonomous AI agent that helps you parse resumes, score candidates, and manage your pipeline with Llama 3.',
            guide: 'Check our <b>User Guide</b> for a full walkthrough of features like AI Scorecards, Personality Quizzes, and Interview Scheduling.'
        };
        el.innerHTML = responses[topic] || 'How else can I help you?';
    },

    toggleLoginChat() {
        const panel = document.getElementById('login-chatbot-panel');
        if (panel) panel.classList.toggle('hidden');
    },

    downloadReport(candId) {
        const cands = Store.get('candidates', []);
        const c = cands.find(x => x.id === candId);
        if (!c) return this.toast('Candidate not found', 'error');

        const badge = getBadge(c.finalScore || 0);
        const resumeScore = Math.round(((c.atsScore || 0) * 0.36) + ((c.skillsScore || 0) * 0.64));
        
        let report = `HR COPILOT — CANDIDATE ANALYSIS REPORT\n`;
        report += `==========================================\n\n`;
        report += `NAME: ${c.name}\n`;
        report += `JOB: ${c.jobTitle || 'General'}\n`;
        report += `EMAIL: ${c.email || 'N/A'}\n`;
        report += `DATE: ${new Date(c.created).toLocaleString()}\n\n`;
        
        report += `SUMMARY SCORES\n`;
        report += `--------------\n`;
        report += `RESUME SCORE (ATS + SKILLS): ${resumeScore}/100\n`;
        report += `ASSESSMENT SCORE (PERSONALITY): ${c.personalityScores?._overall || 0}/100\n`;
        report += `FINAL COMPOSITE SCORE: ${c.finalScore || 0}/100\n`;
        report += `VERDICT: ${badge ? badge.label : 'N/A'}\n\n`;
        
        if (c.aiAnalysis) {
            report += `AI HOLISTIC ANALYSIS\n`;
            report += `--------------------\n`;
            if (c.aiAnalysis.composite) {
                report += `TECHNICAL: ${c.aiAnalysis.technical.score}/100 - ${c.aiAnalysis.technical.summary}\n`;
                report += `BEHAVIORAL: ${c.aiAnalysis.behavioral.score}/100 - ${c.aiAnalysis.behavioral.summary}\n`;
                report += `NARRATIVE: ${c.aiAnalysis.composite.narrative}\n`;
                report += `VERDICT: ${c.aiAnalysis.composite.verdict}\n`;
            } else {
                report += `SUMMARY: ${c.aiAnalysis.summary || c.aiAnalysis.narrative || 'N/A'}\n`;
            }
            report += `\n`;
        }

        if (c.personalityScores) {
            report += `PERSONALITY TRAITS\n`;
            report += `------------------\n`;
            Object.entries(c.personalityScores).forEach(([k, v]) => {
                if (k !== '_overall') report += `${DIMENSION_LABELS[k] || k}: ${v}/100\n`;
            });
            report += `\n`;
        }

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${c.name.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Full report downloaded!', 'success');
    },



    logout() {
        console.log("App: Logging out...");
        if (Store) Store.clear();
        if (auth) {
            auth.signOut().then(() => {
                console.log("App: Sign out successful");
                location.reload();
            }).catch(err => {
                console.error("App: Sign out error", err);
                this.toast("Logout failed: " + err.message, "error");
            });
        } else {
            console.warn("App: Auth not initialized, reloading anyway");
            location.reload();
        }
    },

    completeSetup() {
        const company = document.getElementById('setup-company-name').value.trim();
        if (!company) { this.toast('Please enter your Company Name', 'error'); return; }
        Store.set('settings', { 
            companyName: company, 
            emailKey: CONFIG.EMAILJS_KEY,
            emailServiceId: CONFIG.EMAILJS_SERVICE, 
            emailTemplateApp: CONFIG.EMAILJS_TEMPLATE_APP,
            emailTemplateInt: CONFIG.EMAILJS_TEMPLATE_INT,
            model: CONFIG.GROQ_MODEL, 
            cultureValues: ['innovation', 'collaboration', 'autonomy'] 
        });
        document.getElementById('setup-overlay').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        this.updateCompanyName();
        this.navigate('dashboard');
        this.toast('HR Copilot is ready!', 'success');
    },

    updateCompanyName() {
        const s = Store.get('settings', {});
        const el = document.getElementById('company-name-display');
        if (el) el.textContent = s.companyName || 'HR Copilot';
    },

    navigate(page) {
        this.currentPage = page;
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.add('hidden');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const pageEl = document.getElementById('page-' + page);
        if (pageEl) { pageEl.classList.add('active'); this.renderPage(page); }
        const navEl = document.querySelector(`[data-page="${page}"]`);
        if (navEl) navEl.classList.add('active');
        document.getElementById('page-title').textContent =
            { dashboard: 'Dashboard', jobs: 'Jobs', candidates: 'Candidates', quiz: 'Personality Quiz',
              interviews: 'Interviews', chatbot: 'AI Chatbot', onboarding: 'Onboarding', settings: 'Settings' }[page] || page;
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
    },

    renderPage(page) {
        const el = document.getElementById('page-' + page);
        if (page === 'quiz-portal') { Quiz.render(); return; }
        if (!el && page !== 'portal') return;
        if (page === 'quiz') { Quiz.render(); return; }
        if (page === 'portal') { 
            const portalEl = document.getElementById('page-portal');
            if (portalEl) portalEl.innerHTML = Pages.portal(this.currentJobId); 
            return; 
        }
        if (Pages[page]) el.innerHTML = Pages[page]();
    },

    openPortal(jobId) {
        this.currentJobId = jobId;
        const jobs = Store.get('jobs', []);
        if (!jobs || jobs.length === 0) {
            // Wait for cloud sync
            const portalEl = document.getElementById('page-portal');
            if (portalEl) {
                portalEl.classList.add('active');
                portalEl.style.display = 'block';
                portalEl.innerHTML = `
                    <div class="quiz-container" style="max-width:600px;margin:0 auto;padding-top:4rem;text-align:center">
                        <div class="animate-pulse" style="font-size:3rem;margin-bottom:1rem">💼</div>
                        <h2>Syncing Job Details...</h2>
                        <p class="text-dim">Retrieving position requirements from cloud. Please wait.</p>
                    </div>`;
            }
            setTimeout(() => this.openPortal(jobId), 1500);
            return;
        }

        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('page-portal').classList.add('active');
        document.getElementById('page-portal').style.display = 'block';
        window.location.hash = '#apply-' + jobId;
        this.renderPage('portal');
    },

    async submitInitialApplication(jobId) {
        const name = document.getElementById('app-name').value.trim();
        const email = document.getElementById('app-email').value.trim();
        const phone = document.getElementById('app-phone').value.trim();
        const fileInput = document.getElementById('app-resume');
        const prog = document.getElementById('app-progress');
        const submitBtn = document.getElementById('submit-app-btn');

        if (!name || !email || !fileInput.files[0]) {
            prog.innerHTML = '<div style="color:var(--danger);margin-top:1rem">Please fill all required fields and upload a resume.</div>';
            return;
        }

        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
            prog.innerHTML = '<div style="color:var(--danger);margin-top:1rem">File too large! Maximum allowed size is 5MB.</div>';
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        prog.innerHTML = '<div style="color:var(--primary);margin-top:1rem" class="animate-pulse">Submitting application...</div>';
        
        try {
            const jobs = Store.get('jobs', []);
            const job = jobs.find(j => j.id === jobId);
            if (!job) throw new Error("Job not found");
            const file = fileInput.files[0];
            let text = await Scoring.parsePDF(file);
            const resumeData = await this.fileToDataURL(file);
            
            // Fallback for empty text (e.g. image PDF)
            if (!text || text.trim().length < 50) {
                text = `${name} | ${email} | ${phone}\nResume could not be parsed automatically.`;
            }

            const uid = Store.uid || '';
            const response = await fetch('/api/candidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit',
                    recruiterUid: uid,
                    jobId: jobId,
                    candidateData: { name, email, phone, resumeText: text, fileName: file.name }
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            const candId = result.candidateId;
            this.currentCandidateId = candId;
            
            localStorage.setItem('pending_candidate_details', JSON.stringify({
                id: candId,
                name: name,
                email: email,
                jobTitle: job.title
            }));
            
            // Sharded Firestore Upload (Bypasses 1MB limit for free)
            if (window.db) {
                const CHUNK_SIZE = 800000; // ~800KB chunks
                const chunks = [];
                for (let i = 0; i < resumeData.length; i += CHUNK_SIZE) {
                    chunks.push(resumeData.substring(i, i + CHUNK_SIZE));
                }

                const docRef = db.collection('resumes').doc(candId);
                docRef.set({ name: file.name, chunkCount: chunks.length, created: Date.now() })
                .then(() => {
                    const promises = chunks.map((chunk, i) => {
                        return docRef.collection('chunks').doc(i.toString()).set({ data: chunk });
                    });
                    return Promise.all(promises);
                })
                .catch(e => console.warn("Resume upload failed:", e));
            }

            // Successfully processed, show Take Assessment button
            if (submitBtn) submitBtn.style.display = 'none';
            prog.innerHTML = `
                <div style="color:var(--success);margin-top:1rem;font-weight:bold;text-align:center;padding:1rem;background:rgba(0,212,170,0.1);border-radius:var(--radius);">
                    ✅ Application Submitted Successfully!<br>
                    <span style="font-weight:normal;font-size:0.95rem;color:var(--text);display:block;margin-top:0.5rem">
                        Please click below to start your personality assessment now.
                    </span>
                </div>`;
            const taContainer = document.getElementById('take-assessment-container');
            if (taContainer) taContainer.style.display = 'block';

            document.querySelectorAll('#application-form input').forEach(el => el.disabled = true);

        } catch (e) {
            prog.innerHTML = `<div style="color:var(--danger);margin-top:1rem">Error: ${e.message}</div>`;
            if (submitBtn) submitBtn.disabled = false;
        }
    },

    startAssessment(jobId) {
        if (!this.currentCandidateId) return;
        Quiz.start(this.currentCandidateId, jobId, true);
    },

    async sendFinalEmail(candId) {
        try {
            let cand = null;
            const cachedDetails = localStorage.getItem('pending_candidate_details');
            if (cachedDetails) {
                try {
                    const details = JSON.parse(cachedDetails);
                    if (details.id === candId) {
                        cand = details;
                    }
                } catch (e) {}
            }
            if (!cand) {
                const cands = Store.get('candidates', []);
                cand = cands.find(c => c.id === candId);
            }
            if (!cand) return;

            const email = (cand.email || '').trim();
            const templateParams = {
                to_name: cand.name,
                to_email: email,
                email: email, // Alias
                recipient: email, // Alias
                job_title: cand.jobTitle || 'the position',
                message: `Hi ${cand.name},\n\nThank you for applying for the ${cand.jobTitle || 'position'} and completing our integrated personality assessment.\n\nWe have received your application and results. Our team is now reviewing your profile and we will get back to you as soon as possible regarding the next steps.\n\nBest regards,\nThe Recruitment Team`
            };

            // Background email
            if (window.emailjs) {
                const s = Store.get('settings', {});
                let templateId = s.emailTemplateApp || CONFIG.EMAILJS_TEMPLATE_APP;
                // Force correct template ID for application confirmation
                if (templateId === 'template_vojci9b') {
                    templateId = CONFIG.EMAILJS_TEMPLATE_APP; // 'template_6erl8j5'
                }
                emailjs.send(
                    s.emailServiceId || CONFIG.EMAILJS_SERVICE, 
                    templateId, 
                    templateParams,
                    s.emailKey || CONFIG.EMAILJS_KEY
                ).then(() => {
                    console.log(`Application email sent successfully with template: ${templateId}`);
                    App.toast(`Application confirmation email sent (Template: ${templateId})`, 'success');
                }).catch(err => {
                    console.error('EmailJS Error:', err);
                    const msg = err.text || err.message || 'Check EmailJS settings';
                    App.toast(`Email failed: ${msg}`, 'warning');
                });
            }
        } catch (e) {
            console.error("sendFinalEmail error:", e);
        }
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            overlay?.classList.remove('hidden');
        } else {
            overlay?.classList.add('hidden');
        }
    },

    // ── Modals ──
    showModal(html) {
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('modal-overlay').classList.remove('hidden');
    },
    closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); },

    // ── Toast ──
    toast(msg, type = 'info') {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
    },

    // ── Jobs ──
    showJobForm(job = null) {
        this.showModal(`
            <h2>${job ? 'Edit' : 'Create'} Job Position</h2>
            <div class="form-group mt-2"><label>Job Title *</label><input id="jf-title" value="${job?.title || ''}"></div>
            <div class="grid grid-2 mt-1">
                <div class="form-group"><label>Department</label><input id="jf-dept" value="${job?.department || ''}"></div>
                <div class="form-group"><label>Location</label><input id="jf-loc" value="${job?.location || 'Remote'}"></div>
            </div>
            <div class="grid grid-2 mt-1">
                <div class="form-group"><label>Type</label><select id="jf-type"><option ${job?.type==='Full-time'?'selected':''}>Full-time</option><option ${job?.type==='Part-time'?'selected':''}>Part-time</option><option ${job?.type==='Contract'?'selected':''}>Contract</option></select></div>
                <div class="form-group"><label>Min Years Exp</label><input type="number" id="jf-yrs" value="${job?.minYears || 0}"></div>
            </div>
            <div class="form-group mt-1"><label>Must-Have Skills (comma-separated) *</label><input id="jf-must" value="${(job?.mustHave||[]).join(', ')}"></div>
            <div class="form-group mt-1"><label>Nice-to-Have Skills</label><input id="jf-nice" value="${(job?.niceToHave||[]).join(', ')}"></div>
            <div class="form-group mt-1"><label>Education</label><input id="jf-edu" value="${job?.education || "Bachelor's"}"></div>
            <div class="form-group mt-1"><label>Description</label><textarea id="jf-desc">${job?.description || ''}</textarea></div>
            <button class="btn btn-primary mt-2 w-full" onclick="App.saveJob('${job?.id || ''}')">Save Job →</button>`);
    },

    saveJob(editId) {
        const title = document.getElementById('jf-title').value.trim();
        const must = document.getElementById('jf-must').value.trim();
        if (!title || !must) { this.toast('Title and must-have skills required', 'error'); return; }
        const jobs = Store.get('jobs', []);
        const job = {
            id: editId || 'job_' + Date.now(), title,
            department: document.getElementById('jf-dept').value.trim(),
            location: document.getElementById('jf-loc').value.trim(),
            type: document.getElementById('jf-type').value,
            minYears: parseInt(document.getElementById('jf-yrs').value) || 0,
            mustHave: must.split(',').map(s => s.trim()).filter(Boolean),
            niceToHave: document.getElementById('jf-nice').value.split(',').map(s => s.trim()).filter(Boolean),
            education: document.getElementById('jf-edu').value.trim(),
            description: document.getElementById('jf-desc').value.trim(),
            cultureValues: [], created: Date.now(), status: 'active', candidates: []
        };
        if (editId) { const idx = jobs.findIndex(j => j.id === editId); if (idx !== -1) jobs[idx] = { ...jobs[idx], ...job }; }
        else jobs.push(job);
        Store.set('jobs', jobs);
        this.closeModal(); this.navigate('jobs'); this.toast('Job saved!', 'success');
    },

    viewJob(id) {
        const jobs = Store.get('jobs', []);
        const j = jobs.find(x => x.id === id);
        if (!j) return;
        this.showModal(`<h2>${j.title}</h2><p class="text-dim">${j.department} · ${j.location} · ${j.type}</p>
            <div class="mt-2"><strong>Must-Have:</strong> ${j.mustHave.map(s => `<span class="tag tag-blue">${s}</span>`).join(' ')}</div>
            <div class="mt-1"><strong>Nice-to-Have:</strong> ${(j.niceToHave || []).map(s => `<span class="tag tag-green">${s}</span>`).join(' ')}</div>
            <div class="mt-1"><strong>Min Experience:</strong> ${j.minYears} years</div>
            <div class="mt-1"><strong>Education:</strong> ${j.education}</div>
            <p class="mt-2">${j.description}</p>
            <div class="flex gap-1 mt-3">
                <button class="btn btn-primary" onclick="App.closeModal();App.showJobForm(${JSON.stringify(j).replace(/"/g, '&quot;')})">Edit</button>
                <button class="btn btn-danger" onclick="App.deleteJob('${id}')">Delete</button>
            </div>`);
    },

    deleteJob(id) {
        let jobs = Store.get('jobs', []); jobs = jobs.filter(j => j.id !== id);
        Store.set('jobs', jobs); this.closeModal(); this.navigate('jobs'); this.toast('Job deleted', 'info');
    },

    // ── Candidates ──
    showUploadModal() {
        const jobs = Store.get('jobs', []);
        this.showModal(`
            <h2>📄 Upload Resumes</h2>
            <div class="form-group mt-2"><label>Target Job *</label>
                <select id="upload-job">${jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('')}</select></div>
            <div class="upload-zone mt-2" id="upload-zone" onclick="document.getElementById('resume-files').click()"
                 ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')"
                 ondrop="event.preventDefault();this.classList.remove('dragover');App.handleFiles(event.dataTransfer.files)">
                <div class="upload-zone-icon">📄</div>
                <div class="upload-zone-text">Drop PDF resumes here or click to browse</div>
                <input type="file" id="resume-files" multiple accept=".pdf,.txt" style="display:none" onchange="App.handleFiles(this.files)">
            </div>
            <div id="upload-progress" class="mt-2"></div>`);
    },

    async handleFiles(files) {
        const jobId = document.getElementById('upload-job')?.value;
        const jobs = Store.get('jobs', []);
        const job = jobs.find(j => j.id === jobId);
        if (!job) { this.toast('Select a job first', 'error'); return; }
        const prog = document.getElementById('upload-progress');
        const candidates = Store.get('candidates', []);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > 5 * 1024 * 1024) {
                this.toast(`Skipping ${file.name}: File exceeds 5MB limit.`, 'error');
                continue;
            }
            prog.innerHTML = `<div class="text-sm animate-pulse">Processing ${i + 1}/${files.length}: ${file.name}...</div>`;
            try {
                let text = '';
                if (file.name.endsWith('.pdf')) { text = await Scoring.parsePDF(file); }
                else { text = await file.text(); }
                
                const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ");

                // Fallback for image-based PDFs
                if (!text || text.trim().length < 50) {
                    text = `${baseName}\nNo parseable text.`;
                }

                const name = Scoring.extractName(text, baseName);
                const email = Scoring.extractEmail(text);
                const phone = Scoring.extractPhone(text);
                const atsResult = await Scoring.atsScore(text, job);
                const skillsResult = await Scoring.skillsScore(text, job);
                const resumeData = await this.fileToDataURL(file);
                const tags = [];
                skillsResult.mustHave.forEach(s => { tags.push({ text: (s.found ? '✅ ' : '⚠️ ') + s.skill, type: s.found ? 'tag-green' : 'tag-yellow' }); });

                const candId = 'cand_' + Date.now() + '_' + i;
                const candidate = {
                    id: candId, name, email, phone, jobId, jobTitle: job.title,
                    resumeText: text, fileName: file.name, created: Date.now(), stage: 'applied',
                    atsScore: atsResult.score, atsDetails: atsResult.details,
                    skillsScore: skillsResult.score, skillsDetails: skillsResult,
                    personalityScores: null, personalityDone: false,
                    aiScore: null, aiAnalysis: null,
                    finalScore: null, tags
                };
                candidates.push(candidate);

                // Sharded Firestore Upload for Bulk Upload
                if (window.db) {
                    const CHUNK_SIZE = 800000;
                    const chunks = [];
                    for (let j = 0; j < resumeData.length; j += CHUNK_SIZE) {
                        chunks.push(resumeData.substring(j, j + CHUNK_SIZE));
                    }
                    const docRef = db.collection('resumes').doc(candId);
                    docRef.set({ name: file.name, chunkCount: chunks.length, created: Date.now() })
                    .then(() => {
                        const promises = chunks.map((chunk, idx) => db.collection('resumes').doc(candId).collection('chunks').doc(idx.toString()).set({ data: chunk }));
                        return Promise.all(promises);
                    }).catch(e => console.warn("Bulk resume upload failed:", e));
                }
            } catch (e) { this.toast(`Error processing ${file.name}: ${e.message}`, 'error'); }
        }
        Store.set('candidates', candidates);
        prog.innerHTML = `<div class="text-sm" style="color:var(--success)">✅ ${files.length} resume(s) processed!</div>`;
        setTimeout(() => { this.closeModal(); this.navigate('candidates'); }, 1000);
        this.toast(`${files.length} candidate(s) added!`, 'success');
    },

    viewCandidate(id) {
        const cands = Store.get('candidates', []);
        const c = cands.find(x => x.id === id);
        if (!c) return;
        this.showModal(Pages.scorecard(c));
    },

    deleteCandidate(id) {
        let cands = Store.get('candidates', []);
        cands = cands.filter(c => c.id !== id);
        Store.set('candidates', cands);
        this.syncDerivedCollections();
        this.closeModal();
        this.navigate('candidates');
        this.toast('Candidate removed', 'info');
    },

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async downloadResume(id) {
        const cands = Store.get('candidates', []);
        const c = cands.find(x => x.id === id);
        if (!c) return this.toast('Candidate not found', 'error');
        
        this.toast('Fetching resume...', 'info');
        let resumeUrl = c.resumeUrl || c.resumeData; 

        // Try Sharded Firestore retrieval
        if (!resumeUrl && window.db) {
            try {
                const doc = await db.collection('resumes').doc(id).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.chunkCount) {
                        // Fetch all chunks
                        const chunkSnap = await db.collection('resumes').doc(id).collection('chunks').get();
                        // Sort by document ID (which is the index 0, 1, 2...)
                        const sortedChunks = chunkSnap.docs
                            .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                            .map(d => d.data().data);
                        resumeUrl = sortedChunks.join('');
                    } else {
                        resumeUrl = data.data; // Legacy single-doc fallback
                    }
                }
            } catch(e) { console.error("Resume fetch error", e); }
        }
        
        if (!resumeUrl) return this.toast('Resume file is not available in the cloud (it may have been too large to sync).', 'error');
        
        // Blob conversion for stable downloads
        try {
            const parts = resumeUrl.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--) u8arr[n] = bstr.charCodeAt(n);
            
            const blob = new Blob([u8arr], {type:mime});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = c.fileName || 'resume.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch(e) {
            console.error("Download error", e);
            // Fallback to direct URL if blob fails
            const a = document.createElement('a');
            a.href = resumeUrl;
            a.download = c.fileName || 'resume.pdf';
            a.click();
        }
    },

    async runAIAnalysis(id, isPublic = false) {
        const btn = document.getElementById('btn-ai-' + id);
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Analyzing...'; }
        try {
            const cands = Store.get('candidates', []);
            const idx = cands.findIndex(c => c.id === id);
            if (idx === -1) return;
            const c = cands[idx];
            const jobs = Store.get('jobs', []);
            const job = jobs.find(j => j.id === c.jobId) || jobs[0] || { title: 'General', mustHave: [], niceToHave: [], minYears: 0, education: '' };

            let result;
            if (c.personalityScores) {
                result = await GroqAI.analyzeWithPersonality(c.resumeText, job, c.personalityScores);
                // Support both new 3-part structure and legacy structure
                c.aiScore = result.composite ? result.composite.score : (result.holisticScore || result.score);
                c.aiAnalysis = result;
            } else {
                result = await GroqAI.scoreCandidate(c.resumeText, job);
                c.aiScore = result.score;
                c.aiAnalysis = result;
            }
            
            c.finalScore = Scoring.compositeScore(c.atsScore, c.skillsScore, c.personalityScores?._overall || 0, c.aiScore);
            
            if (!c.timeline) c.timeline = [];
            c.timeline.push({
                date: Date.now(),
                stage: c.status || 'applied',
                label: `AI Score generated: ${c.aiScore}/100. Verdict: ${c.aiAnalysis?.composite?.verdict || c.aiAnalysis?.verdict || 'Processed'}`,
                icon: '🤖'
            });

            Store.set('candidates', cands);
            
            this.toast('AI Analysis complete', 'success');
            if (this.currentPage === 'candidates') this.renderPage('candidates');
            if (!isPublic) this.viewCandidate(id);
            
        } catch (e) {
            console.error(e);
            this.toast('AI Error: ' + e.message, 'error');
            if (btn) { btn.disabled = false; btn.textContent = '🤖 Run AI Analysis'; }
        }
    },

    createDemoCandidate() {
        const jobs = Store.get('jobs', []);
        const job = jobs[0] || { id: 'job_1', title: 'Software Engineer' };
        const candId = 'cand_demo_' + Date.now();
        const candidate = {
            id: candId,
            name: 'Demo Candidate',
            email: 'demo@example.com',
            phone: '123-456-7890',
            jobId: job.id,
            jobTitle: job.title,
            resumeText: 'Experience in Javascript and AI development.',
            created: Date.now(),
            stage: 'applied',
            atsScore: 85,
            skillsScore: 90,
            personalityDone: false,
            tags: [{ text: '✅ Demo', type: 'tag-green' }]
        };
        const cands = Store.get('candidates', []);
        cands.push(candidate);
        Store.set('candidates', cands);
        this.toast('Demo candidate created!', 'success');
        this.renderPage('dashboard');
    },


    // ── Interviews ──
    showInterviewForm(candidateId = '') {
        const cands = Store.get('candidates', []).filter(c => c.status !== 'hired' && c.stage !== 'hired' && c.status !== 'selected' && c.stage !== 'selected');
        this.showModal(`<h2>📅 Schedule Interview</h2>
            <div class="form-group mt-2"><label>Candidate</label>
                <select id="int-cand">
                    ${cands.filter(c => c.email).map(c => `<option value="${c.id}" ${c.id === candidateId ? 'selected' : ''}>${c.name}</option>`).join('') || '<option value="">No candidates with emails found</option>'}
                </select>
            </div>
            <div class="grid grid-2 mt-1">
                <div class="form-group"><label>Date & Time</label><input type="datetime-local" id="int-date"></div>
                <div class="form-group"><label>Type</label><select id="int-type"><option>Video Call</option><option>In Person</option><option>Phone</option></select></div>
            </div>
            <div class="form-group mt-1"><label>Notes</label><textarea id="int-notes" rows="3"></textarea></div>
            <button class="btn btn-primary mt-2 w-full" onclick="App.saveInterview()">Schedule →</button>`);
    },

    async sendInterviewEmail(candId, date, type, notes) {
        try {
            const cands = Store.get('candidates', []);
            const cand = cands.find(c => c.id === candId);
            if (!cand) return;

            const email = (cand.email || '').trim();
            const formattedDate = new Date(date).toLocaleString();
            const templateParams = {
                to_name: cand.name,
                to_email: email,
                email: email, // Alias
                recipient: email, // Alias
                job_title: cand.jobTitle || 'the position',
                interview_time: `${formattedDate} (${type})`,
                message: `Hi ${cand.name},\n\nWe are excited to invite you for an interview for the ${cand.jobTitle || 'position'} role!\n\nHere are the details:\n- Date & Time: ${formattedDate}\n- Type: ${type}\n${notes ? `- Additional Notes: ${notes}\n` : ''}\nWe look forward to speaking with you.\n\nBest regards,\nThe Recruitment Team`
            };

            if (window.emailjs) {
                const s = Store.get('settings', {});
                let primaryTemplateId = s.emailTemplateInt || CONFIG.EMAILJS_TEMPLATE_INT;
                const fallbackTemplateId = s.emailTemplateApp || CONFIG.EMAILJS_TEMPLATE_APP;

                // Force correct template ID for interview invite if misconfigured in settings
                if (primaryTemplateId === 'template_6erl8j5' || primaryTemplateId === s.emailTemplateApp) {
                    primaryTemplateId = CONFIG.EMAILJS_TEMPLATE_INT; // 'template_vojci9b'
                }

                const sendWithTemplate = (tplId) => {
                    return emailjs.send(
                        s.emailServiceId || CONFIG.EMAILJS_SERVICE, 
                        tplId, 
                        templateParams,
                        s.emailKey || CONFIG.EMAILJS_KEY
                    );
                };

                sendWithTemplate(primaryTemplateId)
                .then(() => {
                    App.toast(`Interview confirmation email sent (Template: ${primaryTemplateId})!`, 'success');
                })
                .catch(err => {
                    const primaryErr = err?.text || err?.message || 'Check EmailJS settings';
                    console.warn(`EmailJS primary template (${primaryTemplateId}) failed, retrying with fallback template (${fallbackTemplateId}):`, err);
                    if (primaryTemplateId !== fallbackTemplateId) {
                        App.toast(`Primary template failed: ${primaryErr}. Trying fallback...`, 'warning');
                        sendWithTemplate(fallbackTemplateId)
                        .then(() => {
                            App.toast(`Interview confirmation email sent (via fallback Template: ${fallbackTemplateId})!`, 'success');
                        })
                        .catch(err2 => {
                            console.error('EmailJS Fallback Error:', err2);
                            const msg = err2.text || err2.message || 'Check EmailJS settings';
                            App.toast(`Email failed: ${msg}`, 'warning');
                        });
                    } else {
                        App.toast(`Email failed: ${primaryErr}`, 'warning');
                    }
                });
            }
        } catch (e) {
            console.error("sendInterviewEmail error:", e);
        }
    },

    async saveInterview() {
        const candId = document.getElementById('int-cand').value;
        const date = document.getElementById('int-date').value;
        const type = document.getElementById('int-type').value;
        const notes = document.getElementById('int-notes').value;
        if (!candId || !date) { this.toast('Fill all fields', 'error'); return; }
        
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candId);
        if (idx === -1) { this.toast('Candidate not found', 'error'); return; }
        const cand = cands[idx];
        if (!cand.email) { 
            this.toast(`Failed: Candidate ${cand.name} has no email address.`, 'error'); 
            return; 
        }

        cand.status = 'interview_scheduled';
        cand.stage = 'interview_scheduled';
        cand.interview = {
            id: 'int_' + Date.now(),
            date: new Date(date).getTime(),
            format: type,
            interviewer: 'Recruiting Team',
            notes: notes,
            outcome: 'pending',
            created: Date.now()
        };

        if (!cand.timeline) cand.timeline = [];
        cand.timeline.push({
            date: Date.now(),
            stage: 'interview_scheduled',
            label: `Interview Scheduled (${type})`,
            icon: '📅'
        });

        Store.set('candidates', cands);

        // Send confirmation email
        await this.sendInterviewEmail(candId, date, type, notes);

        this.closeModal(); this.navigate('interviews'); this.toast('Interview scheduled!', 'success');
    },

    async genQuestions(candidateId) {
        this.toast('Generating AI questions...', 'info');
        const cands = Store.get('candidates', []);
        const c = cands.find(x => x.id === candidateId);
        const jobs = Store.get('jobs', []);
        const job = jobs.find(j => j.id === c?.jobId) || jobs[0] || { title: 'General' };
        try {
            const qs = await GroqAI.generateInterviewQuestions(job, c || {});
            this.showModal(`<h2>🤖 AI Interview Questions</h2><p class="text-dim mb-2">${c?.name || ''} — ${job.title}</p>
                ${qs.map((q, i) => `<div class="checklist-item"><div class="checklist-check">${i + 1}</div><span class="checklist-text">${q}</span></div>`).join('')}`);
        } catch (e) { this.toast('Error: ' + e.message, 'error'); }
    },

    deleteInterview(id) {
        const cands = Store.get('candidates', []);
        const cand = cands.find(c => c.interview && c.interview.id === id);
        if (cand) {
            cand.interview = null;
            cand.status = 'shortlisted';
            cand.stage = 'shortlisted';
            Store.set('candidates', cands);
        }
        this.navigate('interviews');
        this.toast('Interview removed', 'info');
    },

    // ── Chat ──
    async sendChat(forcedMsg = null) {
        const input = document.getElementById('chat-input');
        const msg = typeof forcedMsg === 'string' ? forcedMsg : input.value.trim();
        if (!msg) return;
        if (typeof forcedMsg !== 'string') input.value = '';
        const container = document.getElementById('chat-messages');
        container.innerHTML += `<div class="chat-msg user">${msg}</div>`;
        container.innerHTML += `<div class="chat-msg ai animate-pulse" id="chat-loading">Thinking...</div>`;
        container.scrollTop = container.scrollHeight;
        this.chatHistory.push({ role: 'user', content: msg });
        try {
            const reply = await GroqAI.chat(this.chatHistory);
            this.chatHistory.push({ role: 'assistant', content: reply });
            document.getElementById('chat-loading').remove();
            container.innerHTML += `<div class="chat-msg ai">${reply}</div>`;
        } catch (e) {
            document.getElementById('chat-loading').remove();
            container.innerHTML += `<div class="chat-msg ai" style="color:var(--danger)">Error: ${e.message}</div>`;
        }
        container.scrollTop = container.scrollHeight;
    },

    // ── Onboarding ──
    showOnboardingForm() {
        const cands = Store.get('candidates', []).filter(c => c.status !== 'hired' && c.stage !== 'hired' && c.status !== 'selected' && c.stage !== 'selected' && c.status !== 'onboarding' && c.stage !== 'onboarding');
        this.showModal(`<h2>🎯 New Hire Onboarding</h2>
            <div class="form-group mt-2"><label>Select Candidate</label>
                <select id="ob-cand">
                    ${cands.map(c => `<option value="${c.id}">${c.name} (${c.jobTitle || 'General'})</option>`).join('')}
                    ${!cands.length ? '<option disabled>No candidates available</option>' : ''}
                </select>
            </div>
            <div class="form-group mt-1"><label>Role / Department</label><input id="ob-role" placeholder="e.g. Engineering"></div>
            <div class="form-group mt-1"><label>Onboarding Checklist (Realistic Defaults Provided)</label>
                <textarea id="ob-tasks" rows="8">Sign Employment Contract & NDA
Submit Direct Deposit & Tax Forms
Set up IT Accounts (Email, Slack, Jira)
Receive Company Hardware (Laptop, YubiKey)
Complete Security & Compliance Training
Welcome Lunch with Team
Review 30-60-90 Day Plan
First Week Manager Check-in</textarea></div>
            <button class="btn btn-primary mt-2 w-full" onclick="App.saveOnboarding()">Create Workflow →</button>`);
    },

    saveOnboarding() {
        const candId = document.getElementById('ob-cand')?.value;
        if (!candId) { this.toast('Candidate required', 'error'); return; }
        
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candId);
        if (idx === -1) return;
        
        const c = cands[idx];
        c.status = 'selected';
        c.stage = 'selected';
        
        const tasks = document.getElementById('ob-tasks').value.split('\n')
            .filter(t => t.trim())
            .map(t => ({ text: t.trim(), done: false }));
            
        c.onboarding = {
            id: 'ob_' + Date.now(),
            tasks,
            progress: 0,
            docsChecked: false,
            joiningStatus: 'Pending Contract',
            created: Date.now()
        };
        
        if (!c.timeline) c.timeline = [];
        c.timeline.push({
            date: Date.now(),
            stage: 'selected',
            label: 'Onboarding checklist initialized',
            icon: '🚀'
        });
        
        Store.set('candidates', cands);
        this.closeModal();
        this.navigate('onboarding');
        this.toast('Onboarding created!', 'success');
    },

    toggleTask(candidateId, taskIdx) {
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        const c = cands[idx];
        if (c.onboarding && c.onboarding.tasks[taskIdx]) {
            c.onboarding.tasks[taskIdx].done = !c.onboarding.tasks[taskIdx].done;
            const doneCount = c.onboarding.tasks.filter(t => t.done).length;
            c.onboarding.progress = Math.round((doneCount / c.onboarding.tasks.length) * 100);
            
            const allDone = c.onboarding.progress === 100;
            if (allDone) {
                c.status = 'hired';
                c.stage = 'hired';
                c.onboarding.joiningStatus = 'Boarded';
                if (!c.timeline) c.timeline = [];
                c.timeline.push({
                    date: Date.now(),
                    stage: 'hired',
                    label: 'Onboarding Checklist Completed - Candidate Hired!',
                    icon: '🎉'
                });
                this.toast(`${c.name} is now fully boarded!`, 'success');
            } else {
                c.status = 'selected';
                c.stage = 'selected';
                c.onboarding.joiningStatus = 'In-Progress';
            }
            Store.set('candidates', cands);
            this.navigate('onboarding');
            
            // Re-open accordion after render
            setTimeout(() => {
                const el = document.getElementById('tasks-' + candidateId);
                if (el) el.style.display = 'block';
            }, 50);
        }
    },

    toggleOnboardingDocs(candidateId) {
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        const c = cands[idx];
        if (c.onboarding) {
            c.onboarding.docsChecked = !c.onboarding.docsChecked;
            c.onboarding.joiningStatus = c.onboarding.docsChecked ? 'Docs Verified' : 'Pending Contract';
            Store.set('candidates', cands);
            this.navigate('onboarding');
            // Re-open accordion after render
            setTimeout(() => {
                const el = document.getElementById('tasks-' + candidateId);
                if (el) el.style.display = 'block';
            }, 50);
        }
    },

    completeOnboardingManual(candidateId) {
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        const c = cands[idx];
        c.status = 'hired';
        c.stage = 'hired';
        if (c.onboarding) {
            c.onboarding.tasks.forEach(t => t.done = true);
            c.onboarding.progress = 100;
            c.onboarding.joiningStatus = 'Boarded';
        }
        if (!c.timeline) c.timeline = [];
        c.timeline.push({
            date: Date.now(),
            stage: 'hired',
            label: 'Onboarding completed - Recruiter finalized hire!',
            icon: '🎉'
        });
        Store.set('candidates', cands);
        this.navigate('onboarding');
        this.toast(`${c.name} onboarding finalized!`, 'success');
    },

    deleteOnboarding(candidateId) {
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx !== -1) {
            const c = cands[idx];
            c.onboarding = null;
            c.status = 'shortlisted'; // Revert back to active pool
            c.stage = 'shortlisted';
            Store.set('candidates', cands);
        }
        this.navigate('onboarding');
        this.toast('Onboarding workflow removed', 'info');
    },

    // ── Settings ──
    saveSettings() {
        const s = {
            model: document.getElementById('set-model')?.value || CONFIG.GROQ_MODEL,
            companyName: document.getElementById('set-company')?.value || '',
            cultureValues: (document.getElementById('set-values')?.value || '').split(',').map(v => v.trim()).filter(Boolean),
            emailServiceId: document.getElementById('set-ejs-svc')?.value || CONFIG.EMAILJS_SERVICE,
            emailKey: document.getElementById('set-ejs-key')?.value || CONFIG.EMAILJS_KEY,
            emailTemplateApp: document.getElementById('set-ejs-tpl-app')?.value || CONFIG.EMAILJS_TEMPLATE_APP,
            emailTemplateInt: document.getElementById('set-ejs-tpl-int')?.value || CONFIG.EMAILJS_TEMPLATE_INT
        };
        Store.set('settings', s); this.updateCompanyName(); this.toast('Settings saved!', 'success');
    },

    // ── Interactive Guided Tour ──
    currentTutorialStep: 0,
    tutorialSteps: [
        {
            title: "Welcome to HR Copilot! 🚀",
            text: "Welcome to your autonomous AI recruitment workspace. Let's take a 2-minute interactive tour of how to automate candidate sourcing, scoring, assessments, and interview scheduling!",
            page: null,
            nextText: "Start Tour →"
        },
        {
            title: "1. Recruitment Dashboard 📊",
            text: "This is your main dashboard. Monitor high-level KPIs like Total Candidates, Average ATS Score, and pending onboarding workflows. The funnel graph shows candidates at each recruitment stage.",
            page: "dashboard",
            nextText: "Next: Jobs 💼"
        },
        {
            title: "2. Sourcing & Job Roles 💼",
            text: "Create Job Openings to begin sourcing. Once created, you can copy the custom **Application Link** to share with candidates. They will fill out their profile, upload a PDF resume, and take the AI quiz.",
            page: "jobs",
            nextText: "Next: Candidates 👥"
        },
        {
            title: "3. Auto-Sorted Candidate Pool 👥",
            text: "Candidates are automatically sorted in real-time by their composite scores in descending order. Click on any candidate to view their ATS, skills, and personality scores, and detailed AI feedback card!",
            page: "candidates",
            nextText: "Next: Interviews 📅"
        },
        {
            title: "4. Interview Scheduling 📅",
            text: "Schedule interviews for standout applicants. When scheduled, HR Copilot automatically dispatches beautiful, configured confirmation emails using your EmailJS templates!",
            page: "interviews",
            nextText: "Next: Onboarding 🎯"
        },
        {
            title: "5. Onboarding Tracker 🎯",
            text: "When you hire a candidate, organize their transition with ease. Create custom onboarding workflows with checklist items to ensure they integrate into your team seamlessly.",
            page: "onboarding",
            nextText: "Next: AI Chatbot 💬"
        },
        {
            title: "6. Ask the AI Chatbot 💬",
            text: "The AI Copilot has full real-time access to the recruitment database. You can ask it to draft emails, compare candidate scores, summarize resumes, or write review cards!",
            page: "chatbot",
            nextText: "Next: Settings ⚙️"
        },
        {
            title: "7. System Settings ⚙️",
            text: "Configure your API credentials (Groq API, EmailJS Service/Template IDs) or export database backups. You can also wipe both local cache and cloud databases clean here.",
            page: "settings",
            nextText: "Complete Tour 🎉"
        }
    ],

    startTutorial() {
        this.currentTutorialStep = 0;
        let card = document.getElementById('tutorial-tour-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'tutorial-tour-card';
            card.className = 'card';
            card.style.position = 'fixed';
            card.style.bottom = '24px';
            card.style.right = '24px';
            card.style.width = '360px';
            card.style.zIndex = '10000';
            card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
            card.style.border = '1px solid var(--secondary)';
            card.style.background = 'rgba(15,16,40,0.95)';
            card.style.backdropFilter = 'blur(20px)';
            card.style.transition = 'all 0.3s';
            card.style.padding = '1.8rem';
            card.style.borderRadius = '24px';
            card.style.animation = 'slideIn 0.3s ease-out';
            document.body.appendChild(card);
        }
        this.renderTutorialStep();
    },

    renderTutorialStep() {
        const step = this.tutorialSteps[this.currentTutorialStep];
        const card = document.getElementById('tutorial-tour-card');
        if (!card) return;

        const progress = Math.round(((this.currentTutorialStep + 1) / this.tutorialSteps.length) * 100);

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <span style="font-size:0.8rem; font-weight:bold; color:var(--secondary); text-transform:uppercase; letter-spacing:1px;">🎓 Interactive Tour</span>
                <button onclick="App.endTutorial()" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:1.1rem; padding:0 4px;">✕</button>
            </div>
            <div style="height:4px; width:100%; background:rgba(255,255,255,0.05); border-radius:2px; margin-bottom:1rem; overflow:hidden;">
                <div style="height:100%; width:${progress}%; background:linear-gradient(90deg, var(--primary), var(--secondary)); transition:width 0.3s;"></div>
            </div>
            <h3 style="margin-bottom:0.5rem; font-size:1.15rem; font-weight:800; color:var(--text-bright);">${step.title}</h3>
            <p style="color:var(--text-dim); font-size:0.9rem; line-height:1.5; margin-bottom:1.5rem;">${step.text}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                <button class="btn btn-sm btn-secondary" onclick="App.prevTutorialStep()" ${this.currentTutorialStep === 0 ? 'disabled' : ''}>← Back</button>
                <span style="font-size:0.8rem; color:var(--text-dim); font-weight:500;">${this.currentTutorialStep + 1} / ${this.tutorialSteps.length}</span>
                <button class="btn btn-sm btn-primary" onclick="App.nextTutorialStep()">${step.nextText || 'Next →'}</button>
            </div>
        `;
    },

    nextTutorialStep() {
        if (this.currentTutorialStep < this.tutorialSteps.length - 1) {
            this.currentTutorialStep++;
            const step = this.tutorialSteps[this.currentTutorialStep];
            if (step.page) {
                this.navigate(step.page);
            }
            this.renderTutorialStep();
        } else {
            this.endTutorial();
            this.toast('🎉 Tutorial completed! You are ready to rule HR Copilot!', 'success');
        }
    },

    prevTutorialStep() {
        if (this.currentTutorialStep > 0) {
            this.currentTutorialStep--;
            const step = this.tutorialSteps[this.currentTutorialStep];
            if (step.page) {
                this.navigate(step.page);
            }
            this.renderTutorialStep();
        }
    },

    endTutorial() {
        const card = document.getElementById('tutorial-tour-card');
        if (card) card.remove();
    },

    // ── Export / Import ──
    exportData() {
        const blob = new Blob([Store.exportAll()], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `hr_copilot_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
        this.toast('Data exported!', 'success');
    },

    exportCSV() {
        const cands = Store.get('candidates', []);
        if (!cands.length) { this.toast('No candidates to export', 'error'); return; }
        const headers = ['Name', 'Email', 'Job', 'ATS Score', 'Skills Score', 'Personality', 'AI Score', 'Final Score', 'Stage'];
        const rows = cands.map(c => [c.name, c.email, c.jobTitle, c.atsScore, c.skillsScore, c.personalityScores?._overall || '', c.aiScore || '', c.finalScore || '', c.stage]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `hr_candidates_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        this.toast('CSV exported!', 'success');
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try { Store.importAll(e.target.result); this.navigate(this.currentPage); this.toast('Data imported!', 'success'); }
            catch (err) { this.toast('Invalid JSON file', 'error'); }
        };
        reader.readAsText(file);
    },

    resetAllData() {
        if (!confirm('Are you absolutely sure you want to delete ALL data from the database and local storage? This action is irreversible.')) {
            return;
        }
        
        const syncKeys = ['jobs', 'candidates', 'interviews', 'quizResults', 'onboarding', 'settings'];
        syncKeys.forEach(key => {
            const defaultValue = key === 'settings' ? {} : [];
            Store.set(key, defaultValue);
        });

        this.toast('All database and local storage data has been cleared!', 'success');
        setTimeout(() => {
            location.reload();
        }, 1500);
    },

    syncDerivedCollections() {
        const candidates = Store.get('candidates', []);
        let modified = false;
        
        // Extract interviews
        const ints = candidates
            .filter(c => c.interview && (c.status === 'interview_scheduled' || c.status === 'interview_completed'))
            .map(c => ({
                id: c.interview.id || ('int_' + c.id),
                candidateId: c.id,
                date: c.interview.date,
                type: c.interview.format || c.interview.type || 'Video Call',
                notes: c.interview.notes || '',
                created: c.interview.created || c.created || Date.now()
            }));
        const currentInts = JSON.stringify(Store.get('interviews', []));
        const newInts = JSON.stringify(ints);
        if (currentInts !== newInts) {
            Store.set('interviews', ints);
        }
        
        // Extract onboarding
        const onboarding = candidates
            .filter(c => c.status === 'selected' || c.status === 'onboarding' || c.status === 'hired' || c.stage === 'selected' || c.stage === 'onboarding' || c.stage === 'hired')
            .map(c => {
                if (!c.onboarding) {
                    const defaultTasks = [
                        { text: "Sign Employment Contract & NDA", done: false },
                        { text: "Submit Direct Deposit & Tax Forms", done: false },
                        { text: "Set up IT Accounts (Email, Slack, Jira)", done: false },
                        { text: "Receive Company Hardware (Laptop, YubiKey)", done: false },
                        { text: "Complete Security & Compliance Training", done: false },
                        { text: "Welcome Lunch with Team", done: false },
                        { text: "Review 30-60-90 Day Plan", done: false },
                        { text: "First Week Manager Check-in", done: false }
                    ];
                    c.onboarding = {
                        id: 'ob_' + Date.now(),
                        tasks: defaultTasks,
                        progress: 0,
                        docsChecked: false,
                        joiningStatus: 'Pending Contract',
                        created: Date.now()
                    };
                    modified = true;
                }
                return {
                    id: c.onboarding.id || ('ob_' + c.id),
                    candidateId: c.id,
                    name: c.name,
                    role: c.jobTitle || 'General',
                    tasks: c.onboarding.tasks || [],
                    created: c.onboarding.created || c.created || Date.now(),
                    status: c.status === 'hired' ? 'boarded' : 'in-progress'
                };
            });
            
        if (modified) {
            Store.set('candidates', candidates);
        }
        
        const currentOb = JSON.stringify(Store.get('onboarding', []));
        const newOb = JSON.stringify(onboarding);
        if (currentOb !== newOb) {
            Store.set('onboarding', onboarding);
        }
    },

    handleKanbanDragStart(e, candidateId) {
        e.dataTransfer.setData('text/plain', candidateId);
        e.dataTransfer.effectAllowed = 'move';
    },

    handleKanbanDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    handleKanbanDrop(e, targetStatus) {
        e.preventDefault();
        const column = e.currentTarget;
        if (column) column.classList.remove('dragover');
        
        const candidateId = e.dataTransfer.getData('text/plain');
        if (!candidateId) return;
        
        this.moveCandidateStage(candidateId, targetStatus);
    },

    moveCandidateStage(candidateId, targetStatus) {
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        
        const c = cands[idx];
        const oldStatus = c.status || c.stage || 'applied';
        if (oldStatus === targetStatus) return;
        
        // Target status check
        if (targetStatus === 'interview_scheduled') {
            this.showKanbanScheduleModal(candidateId);
            return;
        }
        
        // If selected: init onboarding
        if (targetStatus === 'selected') {
            const defaultTasks = [
                { text: "Sign Employment Contract & NDA", done: false },
                { text: "Submit Direct Deposit & Tax Forms", done: false },
                { text: "Set up IT Accounts (Email, Slack, Jira)", done: false },
                { text: "Receive Company Hardware (Laptop, YubiKey)", done: false },
                { text: "Complete Security & Compliance Training", done: false },
                { text: "Welcome Lunch with Team", done: false },
                { text: "Review 30-60-90 Day Plan", done: false },
                { text: "First Week Manager Check-in", done: false }
            ];
            c.onboarding = {
                id: c.onboarding?.id || 'ob_' + Date.now(),
                tasks: defaultTasks,
                progress: 0,
                docsChecked: false,
                joiningStatus: 'Pending Contract',
                created: Date.now()
            };
            this.toast(`Candidate selected! Onboarding initialized.`, 'success');
        } else if (targetStatus === 'hired') {
            if (c.onboarding) {
                c.onboarding.tasks.forEach(t => t.done = true);
                c.onboarding.progress = 100;
                c.onboarding.joiningStatus = 'Boarded';
            } else {
                c.onboarding = {
                    id: 'ob_' + Date.now(),
                    tasks: [],
                    progress: 100,
                    docsChecked: true,
                    joiningStatus: 'Boarded',
                    created: Date.now()
                };
            }
            this.toast(`Candidate hired! Onboarding completed.`, 'success');
        }
        
        c.status = targetStatus;
        c.stage = targetStatus;
        if (!c.timeline) c.timeline = [];
        c.timeline.push({
            date: Date.now(),
            stage: targetStatus,
            label: `Stage changed from ${this.formatStageLabel(oldStatus)} to ${this.formatStageLabel(targetStatus)}`,
            icon: this.getStageIcon(targetStatus)
        });
        
        Store.set('candidates', cands);
        this.renderPage('candidates');
    },

    formatStageLabel(stage) {
        const labels = {
            'applied': 'Applied',
            'screening': 'Screening',
            'shortlisted': 'Shortlisted',
            'interview_scheduled': 'Interview Scheduled',
            'interview_completed': 'Interview Completed',
            'selected': 'Selected',
            'onboarding': 'Onboarding',
            'hired': 'Hired',
            'rejected': 'Rejected',
            'on_hold': 'On Hold',
            'withdrawn': 'Withdrawn'
        };
        return labels[stage] || stage;
    },

    getStageIcon(stage) {
        const icons = {
            'applied': '📝',
            'screening': '🔍',
            'shortlisted': '✨',
            'interview_scheduled': '📅',
            'interview_completed': '✅',
            'selected': '🏆',
            'onboarding': '🚀',
            'hired': '🎉',
            'rejected': '❌',
            'on_hold': '⏸️',
            'withdrawn': '💨'
        };
        return icons[stage] || '📌';
    },

    showKanbanScheduleModal(candId) {
        const cands = Store.get('candidates', []);
        const cand = cands.find(c => c.id === candId);
        if (!cand) return;
        
        this.showModal(`
            <h2>📅 Schedule Interview</h2>
            <div class="form-group mt-2">
                <label>Candidate</label>
                <select id="int-cand" disabled style="color:var(--text);background:var(--glass);border-color:var(--border)">
                    <option value="${cand.id}" selected>${cand.name} (${cand.jobTitle || 'General'})</option>
                </select>
            </div>
            <div class="form-group mt-1">
                <label>Date & Time *</label>
                <input type="datetime-local" id="int-date" style="color-scheme:dark;color:var(--text)">
            </div>
            <div class="form-group mt-1">
                <label>Format</label>
                <select id="int-type">
                    <option>Video Call</option>
                    <option>Phone Interview</option>
                    <option>In Person</option>
                </select>
            </div>
            <div class="form-group mt-1">
                <label>Interviewer</label>
                <input id="int-notes" placeholder="e.g. Sarah Jenkins (Engineering Team)">
            </div>
            <div class="form-group mt-1">
                <label>Additional Notes</label>
                <textarea id="int-addnotes" placeholder="Optional notes for candidate..."></textarea>
            </div>
            <button class="btn btn-primary mt-2 w-full" onclick="App.saveKanbanInterview('${candId}')">Schedule →</button>
        `);
    },

    async saveKanbanInterview(candId) {
        const date = document.getElementById('int-date').value;
        const type = document.getElementById('int-type').value;
        const interviewer = document.getElementById('int-notes').value.trim();
        const addNotes = document.getElementById('int-addnotes').value.trim();
        if (!date) { this.toast('Date & Time is required', 'error'); return; }
        
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candId);
        if (idx === -1) return;
        
        const c = cands[idx];
        c.status = 'interview_scheduled';
        c.stage = 'interview_scheduled';
        c.interview = {
            id: 'int_' + Date.now(),
            date: new Date(date).getTime(),
            format: type,
            interviewer: interviewer || 'Recruiting Team',
            notes: addNotes,
            outcome: 'pending',
            created: Date.now()
        };
        
        if (!c.timeline) c.timeline = [];
        c.timeline.push({
            date: Date.now(),
            stage: 'interview_scheduled',
            label: `Interview Scheduled (${type}) with ${interviewer || 'Recruiting Team'}`,
            icon: '📅'
        });
        
        Store.set('candidates', cands);
        
        if (c.email) {
            await this.sendInterviewEmail(candId, date, type, addNotes);
        }
        
        this.closeModal();
        this.renderPage('candidates');
        this.toast('Interview scheduled successfully!', 'success');
    },

    updateInterviewOutcome(candidateId, outcome, notes) {
        if (!candidateId || !outcome) return;
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        
        const c = cands[idx];
        const oldStatus = c.status || c.stage || 'applied';
        
        if (outcome === 'Schedule Interview') {
            this.closeModal();
            this.showKanbanScheduleModal(candidateId);
            return;
        }
        
        if (outcome === 'Reject') {
            const updatedCands = cands.filter(cand => cand.id !== candidateId);
            Store.set('candidates', updatedCands);
            this.syncDerivedCollections();
            this.closeModal();
            this.navigate('candidates');
            this.toast(`Candidate ${c.name} removed from system (Rejected)`, 'info');
            return;
        }
        
        if (!c.interview) c.interview = { outcome: 'pending' };
        c.interview.outcome = outcome;
        c.interview.outcomeNotes = notes || '';
        
        let targetStatus = 'interview_completed';
        let label = `Interview Outcome logged as: ${outcome}`;
        let icon = '✅';
        
        if (outcome === 'Select') {
            targetStatus = 'selected';
            label = 'Candidate Selected for Hiring';
            icon = '🏆';
            
            const defaultTasks = [
                { text: "Sign Employment Contract & NDA", done: false },
                { text: "Submit Direct Deposit & Tax Forms", done: false },
                { text: "Set up IT Accounts (Email, Slack, Jira)", done: false },
                { text: "Receive Company Hardware (Laptop, YubiKey)", done: false },
                { text: "Complete Security & Compliance Training", done: false },
                { text: "Welcome Lunch with Team", done: false },
                { text: "Review 30-60-90 Day Plan", done: false },
                { text: "First Week Manager Check-in", done: false }
            ];
            c.onboarding = {
                id: 'ob_' + Date.now(),
                tasks: defaultTasks,
                progress: 0,
                docsChecked: false,
                joiningStatus: 'Pending Contract',
                created: Date.now()
            };
        } else if (outcome === 'On Hold') {
            targetStatus = 'on_hold';
            label = 'Application placed On Hold';
            icon = '⏸️';
        }
        
        c.status = targetStatus;
        c.stage = targetStatus;
        if (!c.timeline) c.timeline = [];
        c.timeline.push({
            date: Date.now(),
            stage: targetStatus,
            label: label + (notes ? ` (${notes})` : ''),
            icon: icon
        });
        
        Store.set('candidates', cands);
        this.closeModal();
        if (outcome === 'Select' || oldStatus === 'on_hold') {
            this.navigate('candidates');
        } else {
            this.navigate('interviews');
        }
        this.toast(`Outcome logged: ${outcome}`, 'info');
    },

    addCandidateNote(candidateId, text) {
        if (!text) {
            const input = document.getElementById(`note-input-${candidateId}`) || document.getElementById('sc-note-input');
            text = input ? input.value.trim() : '';
        }
        if (!text) return;
        
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        
        const c = cands[idx];
        if (!c.notes) c.notes = [];
        
        const note = {
            author: 'Recruiter',
            text: text,
            date: Date.now()
        };
        c.notes.push(note);
        
        if (!c.timeline) c.timeline = [];
        c.timeline.push({
            date: Date.now(),
            stage: c.status || 'applied',
            label: `Note added: "${text.substring(0, 30)}..."`,
            icon: '💬'
        });
        
        Store.set('candidates', cands);
        
        const input = document.getElementById(`note-input-${candidateId}`) || document.getElementById('sc-note-input');
        if (input) input.value = '';
        
        // Re-render scorecard showing the updated collaboration tab
        this.showModal(Pages.scorecard(c));
        // Switch to collaboration tab automatically
        setTimeout(() => {
            const btn = document.getElementById('btn-sc-tab-collab');
            if (btn) btn.click();
        }, 50);
    },

    addCandidateTag(candidateId, tagText) {
        if (!tagText) {
            const input = document.getElementById(`tag-input-${candidateId}`) || document.getElementById('sc-tag-input');
            tagText = input ? input.value.trim() : '';
        }
        if (!tagText) return;
        
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        
        const c = cands[idx];
        if (!c.tags) c.tags = [];
        
        if (c.tags.some(t => t.text.toLowerCase() === tagText.toLowerCase())) {
            this.toast('Tag already exists', 'warning');
            return;
        }
        
        const types = ['tag-blue', 'tag-green', 'tag-purple', 'tag-yellow'];
        const randomType = types[c.tags.length % types.length];
        
        c.tags.push({ text: tagText, type: randomType });
        Store.set('candidates', cands);
        
        const input = document.getElementById(`tag-input-${candidateId}`) || document.getElementById('sc-tag-input');
        if (input) input.value = '';
        
        this.showModal(Pages.scorecard(c));
        setTimeout(() => {
            const btn = document.getElementById('btn-sc-tab-collab');
            if (btn) btn.click();
        }, 50);
    },

    removeCandidateTag(candidateId, tagText) {
        const cands = Store.get('candidates', []);
        const idx = cands.findIndex(c => c.id === candidateId);
        if (idx === -1) return;
        
        const c = cands[idx];
        if (c.tags) {
            c.tags = c.tags.filter(t => t.text !== tagText);
            Store.set('candidates', cands);
            this.showModal(Pages.scorecard(c));
            setTimeout(() => {
                const btn = document.getElementById('btn-sc-tab-collab');
                if (btn) btn.click();
            }, 50);
        }
    },

    showLogOutcomeModal(candidateId) {
        const cands = Store.get('candidates', []);
        const c = cands.find(cand => cand.id === candidateId);
        if (!c) return;
        
        const isOnHold = (c.status || c.stage) === 'on_hold';
        const optionsHtml = isOnHold ? `
            <option value="Schedule Interview">Schedule Interview</option>
            <option value="Select">Select (Approve for Hiring)</option>
            <option value="Reject">Reject (Archive Candidate)</option>
        ` : `
            <option value="Select">Select (Approve for Hiring)</option>
            <option value="Reject">Reject (Archive Candidate)</option>
            <option value="On Hold">On Hold (Keep in Pool)</option>
        `;
        
        this.showModal(`
            <h2>Outcome for ${c.name}</h2>
            <p class="text-dim text-sm" style="margin-bottom:1rem">${c.jobTitle || 'General Position'}</p>
            <div class="form-group mb-2">
                <label>Status / Action</label>
                <select id="out-outcome" style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:inherit">
                    ${optionsHtml}
                </select>
            </div>
            <div class="form-group mb-3">
                <label>Evaluator Feedback Notes</label>
                <textarea id="out-notes" rows="4" placeholder="Technical/culture evaluation notes..." style="width:100%; padding:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:inherit"></textarea>
            </div>
            <div class="flex gap-1">
                <button class="btn btn-secondary w-full" style="justify-content:center" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-primary w-full" style="justify-content:center" onclick="App.updateInterviewOutcome('${c.id}', document.getElementById('out-outcome').value, document.getElementById('out-notes').value)">Log Outcome</button>
            </div>
        `);
    },

    toggleCandidateViewMode(mode) {
        this.candidateViewMode = mode;
        this.renderPage('candidates');
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.boot());
