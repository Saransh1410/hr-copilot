/* quiz.js — Adaptive personality quiz engine */
const Quiz = {
    state: { current: 0, answers: [], candidateId: null, jobId: null, active: false, isPublic: false, maxTime: 20, timeLeft: 20, timerId: null, startTime: 0 },

    async start(candidateId, jobId, isPublic = false) {
        if (this.startTimeout) clearTimeout(this.startTimeout);

        let resolvedJobId = jobId;

        if (isPublic && candidateId) {
            this.renderInactive(0, 0, 'loading');
            let status = null;
            try {
                const response = await fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getStatus', recruiterUid: Store.uid, candidateId })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                status = await response.json();
            } catch (err) {
                console.error("Quiz: failed to check status", err);
            }

            if (!status || !status.exists) {
                // If not found, check if we should wait or give up
                this.retryCount = (this.retryCount || 0) + 1;
                
                if (this.retryCount < 10) {
                    this.startTimeout = setTimeout(() => this.start(candidateId, jobId, isPublic), 2000);
                    return;
                } else {
                    this.renderInactive(0, 0, 'notfound');
                    this.retryCount = 0; // Reset for manual retry
                    return;
                }
            }
            
            // Candidate found! Reset retry count
            this.retryCount = 0;
            resolvedJobId = status.jobId || jobId;

            if (status.timeSlot) {
                const now = Date.now();
                const startWindow = status.timeSlot;
                const endWindow = startWindow + (15 * 60 * 1000); // +15 mins

                if (now < startWindow) {
                    this.renderInactive(startWindow, endWindow, 'early');
                    return;
                }
                if (now > endWindow) {
                    this.renderInactive(startWindow, endWindow, 'expired');
                    return;
                }
            }
        }
        
        this.state = { current: 0, answers: [], candidateId, jobId: resolvedJobId, active: true, isPublic, maxTime: 20, timeLeft: 20, timerId: null, startTime: Date.now() };
        this.render();
    },

    renderInactive(start, end, reason) {
        const container = document.getElementById('page-portal');
        if (!container) return;
        
        if (reason === 'loading') {
            container.innerHTML = `
                <div class="quiz-container" style="max-width:600px;margin:0 auto;padding-top:4rem;text-align:center">
                    <div class="animate-pulse" style="font-size:3rem;margin-bottom:1rem">⚡</div>
                    <h2>Syncing Assessment...</h2>
                    <p class="text-dim">Retrieving your secure session. Please wait.</p>
                </div>`;
            return;
        }
        if (reason === 'notfound') {
            container.innerHTML = `
                <div class="quiz-container" style="max-width:600px;margin:0 auto;padding-top:4rem;text-align:center">
                    <div class="card" style="padding:3rem">
                        <div style="font-size:3rem;margin-bottom:1rem">❓</div>
                        <h2>Assessment Not Found</h2>
                        <p class="text-dim mt-1">This link appears to be invalid or has been removed. Please contact HR for a new assessment link.</p>
                        <button class="btn btn-primary mt-3" onclick="location.reload()">Retry Connection</button>
                    </div>
                </div>`;
            return;
        }
        const msg = reason === 'early' 
            ? `Your assessment will be available starting at <strong style="color:var(--primary)">${new Date(start).toLocaleString()}</strong>.<br>Please return at that exact time.`
            : `Your 15-minute assessment window expired at <strong style="color:var(--danger)">${new Date(end).toLocaleString()}</strong>.<br>Please contact HR if you need a new link.`;
        
        container.innerHTML = `
            <div class="quiz-container" style="max-width:600px;margin:0 auto;padding-top:2rem;text-align:center">
                <div class="card" style="padding:4rem 2rem">
                    <div style="font-size:4rem;margin-bottom:1rem">${reason === 'early' ? '⏳' : '❌'}</div>
                    <h2 style="margin-bottom:1rem">Assessment Unavailable</h2>
                    <p style="color:var(--text-dim);line-height:1.6">${msg}</p>
                </div>
            </div>`;
    },

    render() {
        const s = this.state;
        const container = s.isPublic ? document.getElementById('page-portal') : document.getElementById('page-quiz');
        
        if (s.timerId) clearInterval(s.timerId);
        
        if (!s.active) {
            container.innerHTML = s.isPublic ? '' : this.renderLanding();
            return;
        }
        if (s.current >= QUIZ_QUESTIONS.length) {
            this.complete();
            return;
        }
        
        s.startTime = Date.now();
        s.timeLeft = s.maxTime;
        
        const q = QUIZ_QUESTIONS[s.current];
        const pct = Math.round((s.current / QUIZ_QUESTIONS.length) * 100);
        container.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-progress">
                    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
                    <span class="quiz-progress-text">${s.current + 1} / ${QUIZ_QUESTIONS.length}</span>
                </div>
                
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
                    <div style="flex:1;height:4px;background:var(--border);border-radius:4px"><div id="quiz-timer-bar" style="height:100%;width:100%;background:var(--danger);transition:width 1s linear"></div></div>
                    <span id="quiz-timer-text" style="color:var(--danger);font-weight:bold;font-variant-numeric:tabular-nums">${s.timeLeft}s</span>
                </div>

                <div class="card" style="padding:2rem">
                    <div class="text-sm text-dim mb-1" style="text-transform:uppercase;letter-spacing:.05em">${DIMENSION_LABELS[q.d]}</div>
                    <div class="quiz-question">${q.q}</div>
                    <div class="quiz-options">
                        ${q.o.map((opt, i) => `
                            <div class="quiz-option" onclick="Quiz.answer(${i})" id="quiz-opt-${i}">${opt.t}</div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
            
        s.timerId = setInterval(() => {
            s.timeLeft--;
            const timerBar = document.getElementById('quiz-timer-bar');
            const timerText = document.getElementById('quiz-timer-text');
            if (timerBar) timerBar.style.width = Math.max(0, (s.timeLeft / s.maxTime) * 100) + '%';
            if (timerText) timerText.textContent = s.timeLeft + 's';
            if (s.timeLeft <= 0) {
                clearInterval(s.timerId);
                this.answer(-1, true);
            }
        }, 1000);
    },

    answer(idx, isTimeout = false) {
        if (this.state.timerId) clearInterval(this.state.timerId);
        
        const q = QUIZ_QUESTIONS[this.state.current];
        const timeTaken = Math.max(0, this.state.maxTime - this.state.timeLeft);
        this.state.answers.push({ 
            text: q.q, 
            dimension: q.d, 
            score: idx === -1 ? 0 : q.o[idx].s, 
            maxScore: 5, 
            timeTaken 
        });
        
        document.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none');
        if (idx !== -1) document.getElementById('quiz-opt-' + idx).classList.add('selected');
        
        // Speed check logic to increase difficulty (reduce maxTime)
        const actualTimeTaken = (Date.now() - this.state.startTime) / 1000;
        if (!isTimeout && actualTimeTaken < 3) {
            // Answered unusually fast, decrease timer for next question to prevent speedrunning
            this.state.maxTime = Math.max(5, this.state.maxTime - 2);
        } else if (actualTimeTaken > 8 && this.state.maxTime < 20) {
            // Give back some time if they took longer
            this.state.maxTime = Math.min(20, this.state.maxTime + 1);
        }

        setTimeout(() => { this.state.current++; this.render(); }, 400);
    },

    calcScores() {
        const dims = {};
        this.state.answers.forEach(a => {
            if (!dims[a.dimension]) dims[a.dimension] = { total: 0, max: 0, count: 0 };
            dims[a.dimension].total += a.score;
            dims[a.dimension].max += a.maxScore;
            dims[a.dimension].count++;
        });
        const scores = {};
        let sum = 0, cnt = 0;
        Object.entries(dims).forEach(([k, v]) => {
            scores[k] = Math.round((v.total / v.max) * 100);
            sum += scores[k]; cnt++;
        });
        scores._overall = cnt > 0 ? Math.round(sum / cnt) : 0;
        return scores;
    },

    async complete() {
        const scores = this.calcScores();
        const container = this.state.isPublic ? document.getElementById('page-portal') : document.getElementById('page-quiz');
        
        if (container) {
            container.innerHTML = `
                <div class="quiz-container" style="max-width:600px;margin:0 auto;padding-top:4rem;text-align:center">
                    <div class="animate-pulse" style="font-size:3rem;margin-bottom:1rem">⏳</div>
                    <h2>Saving Results...</h2>
                    <p class="text-dim">Submitting your personality assessment securely.</p>
                </div>`;
        }

        try {
            const response = await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit',
                    recruiterUid: Store.uid,
                    candidateId: this.state.candidateId,
                    scores,
                    answers: this.state.answers,
                    jobId: this.state.jobId
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            await response.json();

            // Save locally only if recruiter is authenticated (non-public mode)
            if (!this.state.isPublic) {
                if (this.state.candidateId) {
                    const candidates = Store.get('candidates', []);
                    const idx = candidates.findIndex(c => c.id === this.state.candidateId);
                    if (idx !== -1) {
                        candidates[idx].personalityScores = scores;
                        candidates[idx].personalityDone = true;
                        candidates[idx].quizLog = this.state.answers;
                        Store.set('candidates', candidates);
                    }
                }
                const results = Store.get('quizResults', []);
                results.push({ candidateId: this.state.candidateId, jobId: this.state.jobId, scores, date: Date.now() });
                Store.set('quizResults', results);
            }

            this.renderResults(scores);
            
            if (this.state.isPublic) {
                App.sendFinalEmail(this.state.candidateId);
            } else {
                App.toast('Personality assessment complete!', 'success');
            }
        } catch (e) {
            console.error("Quiz submission failed:", e);
            App.toast('Failed to save assessment results: ' + e.message, 'error');
            if (container) {
                container.innerHTML = `
                    <div class="quiz-container" style="max-width:600px;margin:0 auto;padding-top:4rem;text-align:center">
                        <div class="card" style="padding:3rem">
                            <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
                            <h2>Submission Failed</h2>
                            <p class="text-dim mt-1">${e.message || 'An error occurred during submission.'}</p>
                            <button class="btn btn-primary mt-3" onclick="Quiz.complete()">Retry Submission</button>
                        </div>
                    </div>`;
            }
            return;
        }
        
        this.state.active = false;
    },

    renderResults(scores) {
        const container = this.state.isPublic ? document.getElementById('page-portal') : document.getElementById('page-quiz');
        const dims = Object.entries(scores).filter(([k]) => k !== '_overall');
        container.innerHTML = `
            <div class="quiz-container">
                <div class="card" style="padding:2rem;text-align:center">
                    <h2 style="font-size:1.5rem;margin-bottom:.5rem">Assessment Complete</h2>
                    <p class="text-dim mb-3">Your personality profile has been saved.</p>
                    
                    ${this.state.isPublic ? `
                        <div style="padding: 2rem; background: var(--glass); border-radius: var(--radius); border: 1px solid var(--success);">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                            <h3 style="color: var(--success)">Assessment Complete!</h3>
                            <p style="margin-top: 1rem; color: var(--text-dim)">Thank you for completing the assessment. Your application is now fully submitted.</p>
                            <p style="margin-top: 1rem; font-weight: bold; color: var(--primary);">You will receive an email from us shortly with further updates.</p>
                            <div class="mt-3"><span class="badge badge-success">✓ Application Complete</span></div>
                        </div>
                    ` : `
                        <div class="final-score-card score-module" style="margin-bottom:1.5rem">
                            <div class="final-score-value">${scores._overall}</div>
                            <div class="text-dim">Overall Personality Score</div>
                        </div>
                        <div style="text-align:left">
                            ${dims.map(([k, v]) => `
                                <div class="score-bar-wrap">
                                    <div class="score-bar-label"><span>${DIMENSION_LABELS[k] || k}</span><span>${v}/100</span></div>
                                    <div class="score-bar"><div class="score-bar-fill personality" style="width:${v}%"></div></div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-3 flex gap-1" style="justify-content:center">
                            <button class="btn btn-primary" onclick="Quiz.render()">← Back to Quiz</button>
                            ${this.state.candidateId ? `<button class="btn btn-success" onclick="App.navigate('candidates')">View Candidate</button>` : ''}
                        </div>
                    `}
                </div>
            </div>`;
    },

    renderLanding() {
        const candidates = Store.get('candidates', []);
        const noQuiz = candidates.filter(c => !c.personalityDone);
        return `
            <div class="section-header"><h2 class="section-title">🧠 Personality & Culture Fit Assessment</h2></div>
            <div class="grid grid-2">
                <div class="card" style="padding:2rem">
                    <h3 style="margin-bottom:.8rem">Start New Assessment</h3>
                    <p class="text-dim text-sm mb-2">30 adaptive questions measuring Big Five personality traits + Culture Fit alignment</p>
                    <div class="form-group mb-2">
                        <label for="quiz-candidate-select">Select Candidate</label>
                        <select id="quiz-candidate-select">
                            <option value="">— Choose a candidate —</option>
                            ${noQuiz.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            ${noQuiz.length === 0 ? '<option disabled>No pending candidates</option>' : ''}
                        </select>
                    </div>
                    <button class="btn btn-primary w-full" onclick="Quiz.startFromSelect()">Begin Assessment →</button>
                </div>
                <div class="card" style="padding:2rem">
                    <h3 style="margin-bottom:.8rem">Quiz Details</h3>
                    <div class="text-sm" style="line-height:1.8">
                        <div>⏱️ <strong>Duration:</strong> ~8 minutes</div>
                        <div>📝 <strong>Questions:</strong> 30 adaptive</div>
                        <div>📊 <strong>Dimensions:</strong> 6 personality traits</div>
                        <div class="mt-2" style="color:var(--text-dim)">
                            Openness • Conscientiousness • Extraversion<br>
                            Agreeableness • Emotional Stability • Culture Fit
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-3">
                <h3 class="mb-2">Recent Assessments</h3>
                ${this.renderHistory()}
            </div>`;
    },

    renderHistory() {
        const results = Store.get('quizResults', []);
        const candidates = Store.get('candidates', []);
        if (results.length === 0) return '<div class="empty-state"><div class="empty-state-icon">🧠</div><p>No assessments yet</p></div>';
        return results.slice(-10).reverse().map(r => {
            const c = candidates.find(c => c.id === r.candidateId);
            return `<div class="card mb-1" style="padding:1rem;display:flex;align-items:center;justify-content:space-between">
                <div><strong>${c ? c.name : 'Unknown'}</strong><span class="text-dim text-sm ml-1"> — ${new Date(r.date).toLocaleDateString()}</span></div>
                <div class="badge badge-primary">${r.scores._overall}/100</div>
            </div>`;
        }).join('');
    },

    startFromSelect() {
        const sel = document.getElementById('quiz-candidate-select');
        if (!sel || !sel.value) { App.toast('Please select a candidate', 'error'); return; }
        const candidates = Store.get('candidates', []);
        const c = candidates.find(c => c.id === sel.value);
        this.start(sel.value, c?.jobId || null);
    }
};
