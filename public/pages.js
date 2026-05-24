/* pages.js — Page renderers */
const Pages={
login(){
    return `
    <div class="setup-card" style="max-width:480px; position:relative">
        <div class="setup-icon">🔒</div>
        <h1>Welcome</h1>
        <p class="setup-subtitle">Sign in to manage your recruitment pipeline</p>
        
        <div id="login-form-area">
            <div class="form-group mt-2">
                <label>Email Address</label>
                <input type="email" id="auth-email" placeholder="hr@company.com">
            </div>
            <div class="form-group mt-1">
                <label>Password</label>
                <div style="position: relative; display: flex; align-items: center; width: 100%;">
                    <input type="password" id="auth-pass" placeholder="••••••••" style="padding-right: 2.5rem; width: 100%;">
                    <button type="button" onclick="const p = document.getElementById('auth-pass'); p.type = p.type === 'password' ? 'text' : 'password'; this.textContent = p.type === 'password' ? '👁️' : '🔒';" style="position: absolute; right: 12px; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 1.1rem; padding: 0; outline: none; display: flex; align-items: center; justify-content: center; height: 100%; width: 24px; z-index: 10;">👁️</button>
                </div>
                <div style="text-align:right; margin-top: 0.4rem;">
                    <a href="javascript:void(0)" style="font-size: 0.8rem; color: var(--text-dim);" onclick="App.showReset()">Forgot Password?</a>
                </div>
            </div>
            
            <div class="flex gap-1 mt-2">
                <button class="btn btn-primary w-full" style="justify-content:center" onclick="App.signIn()">Sign In</button>
                <button class="btn btn-secondary w-full" style="justify-content:center" onclick="App.signUp()">Sign Up</button>
            </div>
        </div>
        
        <div style="margin: 1.5rem 0; display:flex; align-items:center; gap:10px; color:var(--text-dim)">
            <div style="flex:1; height:1px; background:var(--border)"></div>
            <span>or</span>
            <div style="flex:1; height:1px; background:var(--border)"></div>
        </div>
        <button class="btn btn-secondary w-full" style="justify-content:center; gap:10px" onclick="App.googleLogin()">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18">
            Continue with Google
        </button>

        </div>
    </div>`;
},

resetView() {
    return `
    <div class="setup-card" style="max-width:480px; position:relative">
        <div class="setup-icon">🔑</div>
        <h1>Reset Password</h1>
        <p class="setup-subtitle">Enter your email and we'll send a secure link to your inbox.</p>
        
        <div class="form-group mt-2">
            <label>Email Address</label>
            <input type="email" id="reset-email" placeholder="hr@company.com">
        </div>
        
        <div class="flex gap-1 mt-2">
            <button class="btn btn-primary w-full" style="justify-content:center" onclick="App.sendReset()">Send Link →</button>
            <button class="btn btn-secondary w-full" style="justify-content:center" onclick="App.showLogin()">Back</button>
        </div>

        <div style="margin: 1.5rem 0; text-align:center; color:var(--text-dim); font-size: 0.85rem">
            Once sent, check your spam folder if you don't see it within 2 minutes.
        </div>
    </div>`;
},

resetSuccess(email) {
    return `
    <div class="setup-card" style="max-width:480px; position:relative">
        <div class="setup-icon" style="color:var(--success)">✅</div>
        <h1>Request Sent</h1>
        <p class="setup-subtitle">We've verified <strong>${email}</strong> and sent a secure reset link to your inbox.</p>
        
        <div style="background:rgba(0,212,170,0.1); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--success); margin:1.5rem 0; text-align:left; font-size:0.9rem">
            <strong>Next Steps:</strong>
            <ul style="margin-top:0.5rem; padding-left:1.2rem; line-height:1.6">
                <li>Check your inbox (and spam folder)</li>
                <li>Click the link in the email</li>
                <li>Set your new password on the secure page</li>
            </ul>
        </div>
        
        <button class="btn btn-primary w-full" style="justify-content:center" onclick="App.showLogin()">Return to Login</button>
    </div>`;
},

dashboard(){
 const jobs=Store.get('jobs',[]),cands=Store.get('candidates',[]);
 const scored=cands.filter(c=>c.finalScore && c.status !== 'hired' && c.stage !== 'hired' && c.status !== 'selected' && c.stage !== 'selected' && c.status !== 'onboarding' && c.stage !== 'onboarding');
 const stages={
   applied: 0,
   screening: 0,
   shortlisted: 0,
   interview_scheduled: 0,
   interview_completed: 0,
   on_hold: 0,
   selected: 0,
   onboarding: 0,
   hired: 0
 };
 cands.forEach(c=>{
   const st = c.status || c.stage || 'applied';
   if (stages[st] !== undefined) stages[st]++;
   else stages.applied++;
 });
 const activeInterviews = cands.filter(c => c.status === 'interview_scheduled').length;
 return `
 <div class="grid grid-3 mb-3">
  <div class="card kpi-card"><div class="kpi-label">Open Positions</div><div class="kpi-value">${jobs.filter(j=>j.status==='active').length}</div></div>
  <div class="card kpi-card"><div class="kpi-label">Total Candidates</div><div class="kpi-value">${cands.length}</div></div>
  <div class="card kpi-card"><div class="kpi-label">Active Interviews</div><div class="kpi-value">${activeInterviews}</div></div>
 </div>
 <div class="grid grid-2">
  <div class="card">
   <div class="card-header"><span class="card-title">📊 Pipeline Funnel</span></div>
   <div class="funnel">
    ${Object.entries(stages).map(([k,v],i)=>{const colors=['#6C63FF','#8B7BFF','#4D96FF','#00D4AA','#00E8BB','#A0A0C0','#FFB547','#FF8B8B','#00FF87'];
     const pct=cands.length?Math.max(8,(v/cands.length)*100):8;
     const formattedKey = k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
     return `<div class="funnel-stage"><span class="funnel-label">${formattedKey}</span><div class="funnel-bar" style="width:${pct}%;background:${colors[i%colors.length]}">${v}</div></div>`}).join('')}
   </div>
  </div>
  <div class="card">
   <div class="card-header"><span class="card-title">🏆 Top Candidates</span></div>
   ${scored.length?scored.sort((a,b)=>b.finalScore-a.finalScore).slice(0,5).map(c=>`
    <div class="flex-between mb-1" style="padding:.5rem 0;border-bottom:1px solid var(--border)">
     <div><strong>${c.name}</strong><span class="text-dim text-sm"> — ${c.jobTitle||''}</span></div>
     <span class="badge ${c.finalScore>=85?'badge-success':c.finalScore>=70?'badge-primary':'badge-warning'}">${c.finalScore}</span>
    </div>`).join(''):'<div class="empty-state"><div class="empty-state-icon">📋</div><p>Upload resumes to see rankings</p></div>'}
  </div>
 </div>
 <div class="card mt-2">
  <div class="card-header"><span class="card-title">⚡ Recent Activity</span></div>
  ${cands.slice(-5).reverse().map(c=>`<div class="text-sm mb-1" style="padding:.4rem 0;border-bottom:1px solid var(--border)">
   <strong>${c.name}</strong> applied for <span style="color:var(--primary)">${c.jobTitle||'—'}</span>
   <span class="text-dim"> — ${new Date(c.created).toLocaleDateString()}</span></div>`).join('')||'<p class="text-dim">No activity yet</p>'}
 </div>`;
},

jobs(){
 const jobs=Store.get('jobs',[]);
 return `
 <div class="section-header"><h2 class="section-title">💼 Job Positions</h2>
  <button class="btn btn-primary" onclick="App.showJobForm()">+ Create Job</button></div>
 <div class="grid grid-2">
  ${jobs.map(j=>`<div class="card job-card" onclick="App.viewJob('${j.id}')" style="cursor:pointer">
   <div class="flex-between mb-1">
    <h3 style="font-size:1.1rem;font-weight:700;color:var(--text-bright)">${j.title}</h3>
    <span class="badge ${j.status==='active'?'badge-success':'badge-warning'}" style="text-transform:uppercase;font-size:0.65rem;letter-spacing:0.05em">${j.status}</span>
   </div>
   <p class="text-dim text-sm">${j.department} · ${j.location} · ${j.type}</p>
   <div class="candidate-tags mt-2">
    ${j.mustHave.slice(0,3).map(s=>`<span class="tag tag-blue">${s}</span>`).join('')}
    ${j.mustHave.length>3?`<span class="tag tag-blue">+${j.mustHave.length-3}</span>`:''}
   </div>
   <div class="text-sm text-dim mt-3" style="display:flex;justify-content:space-between;align-items:center">
    <span>👥 ${(j.candidates||[]).length} candidates</span>
    <span>🎯 Min ${j.minYears}yr exp</span>
   </div>
   <div class="flex gap-1 mt-3" style="background:rgba(0,0,0,0.2);padding:0.5rem;border-radius:12px;border:1px solid var(--border)">
       <button class="btn btn-sm btn-secondary w-full" style="background:transparent;border:none;justify-content:center" onclick="event.stopPropagation(); const uid = auth.currentUser ? auth.currentUser.uid : ''; window.open(window.location.origin + window.location.pathname + '#apply-' + uid + '---${j.id}', '_blank')">🔗 Open Portal</button>
       <button class="btn btn-sm btn-primary" style="padding:0.5rem;min-width:40px;justify-content:center" title="Copy Link" onclick="event.stopPropagation(); const uid = auth.currentUser ? auth.currentUser.uid : ''; navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#apply-' + uid + '---${j.id}'); App.toast('Application link copied!', 'success')">📋</button>
   </div>
  </div>`).join('')}
  ${!jobs.length?'<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">💼</div><p>No jobs yet. Create your first position!</p></div>':''}
 </div>`;
},

candidates(){
 const cands=Store.get('candidates',[]).filter(c => c.status !== 'hired' && c.stage !== 'hired' && c.status !== 'selected' && c.stage !== 'selected' && c.status !== 'onboarding' && c.stage !== 'onboarding'),jobs=Store.get('jobs',[]);
 
 const getBadge = (score) => {
  if (score >= 85) return { cls: 'badge-success', label: 'EXCELLENT' };
  if (score >= 70) return { cls: 'badge-primary', label: 'GOOD' };
  if (score >= 50) return { cls: 'badge-warning', label: 'AVERAGE' };
  return { cls: 'badge-danger', label: 'POOR' };
 };

 const renderCard = (c, isHidden, jobId) => {
  const badge=getBadge(c.finalScore||0);
  return `<div class="card candidate-card ${isHidden ? `hidden-cand-${jobId} hidden` : ''}" onclick="App.viewCandidate('${c.id}')" style="cursor:pointer">
  <div class="candidate-header">
   <div class="candidate-avatar">${(c.name||'?')[0]}</div>
   <div class="candidate-info"><h3>${c.name}</h3><p style="text-transform:capitalize">${c.stage||c.status||'applied'}</p></div>
   ${c.finalScore?`<span class="final-score-badge ${badge.cls}" style="margin-left:auto;font-size:.78rem;padding:.2rem .7rem">${c.finalScore}</span>`:''}
  </div>
  ${c.atsScore!=null?`<div class="candidate-card-scorecard">
   <div class="score-module" style="padding:.4rem;text-align:center"><div style="font-size:.65rem;color:var(--text-dim)">ATS</div><div style="font-weight:800;font-size:0.9rem">${c.atsScore}</div></div>
   <div class="score-module" style="padding:.4rem;text-align:center"><div style="font-size:.65rem;color:var(--text-dim)">Skills</div><div style="font-weight:800;font-size:0.9rem">${c.skillsScore??'—'}</div></div>
   <div class="score-module" style="padding:.4rem;text-align:center"><div style="font-size:.65rem;color:var(--text-dim)">Person.</div><div style="font-weight:800;font-size:0.9rem">${c.personalityScores?._overall??'—'}</div></div>
   <div class="score-module" style="padding:.4rem;text-align:center"><div style="font-size:.65rem;color:var(--text-dim)">AI</div><div style="font-weight:800;font-size:0.9rem">${c.aiScore??'—'}</div></div>
  </div>`:'<p class="text-dim text-xs mt-1">Pending scoring...</p>'}
  <div class="candidate-tags" style="margin-top:0.5rem">${(c.tags||[]).map(t=>`<span class="tag ${t.type}" style="font-size:0.65rem;padding:0.15rem 0.4rem">${t.text}</span>`).join('')}</div>
 </div>`;
 };

 let html = `
 <div class="section-header">
  <h2 class="section-title">👥 Candidates</h2>
  <div style="display:flex; gap:10px; align-items:center">
   <div class="view-tabs flex gap-1" style="background:rgba(255,255,255,0.05); padding:0.25rem; border-radius:var(--radius-sm); border:1px solid var(--border)">
    <button class="btn btn-sm ${App.candidateViewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}" onclick="App.toggleCandidateViewMode('kanban')" style="padding:0.4rem 0.8rem; font-size:0.8rem">📋 Kanban Board</button>
    <button class="btn btn-sm ${App.candidateViewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" onclick="App.toggleCandidateViewMode('list')" style="padding:0.4rem 0.8rem; font-size:0.8rem">📝 List View</button>
   </div>
   <button class="btn btn-primary" onclick="App.showUploadModal()">📄 Upload Resumes</button>
  </div>
 </div>`;

 if (!cands.length) {
  return html + `<div class="empty-state"><div class="empty-state-icon">👥</div><p>No candidates yet. Upload resumes to get started!</p></div>`;
 }

 if (App.candidateViewMode === 'kanban') {
  const stages = [
   { key: 'applied', label: 'Applied', icon: '📝' },
   { key: 'screening', label: 'Screening', icon: '🔍' },
   { key: 'shortlisted', label: 'Shortlisted', icon: '✨' },
   { key: 'interview_scheduled', label: 'Interview Scheduled', icon: '📅' },
   { key: 'interview_completed', label: 'Interview Completed', icon: '✅' },
   { key: 'on_hold', label: 'On Hold', icon: '⏸️' },
   { key: 'selected', label: 'Selected', icon: '🏆' },
   { key: 'onboarding', label: 'Onboarding', icon: '🚀' },
   { key: 'hired', label: 'Hired', icon: '🎉' }
  ];

  jobs.forEach(j => {
   const jobCands = cands.filter(c => c.jobId === j.id);
   jobCands.sort((a, b) => {
    const scoreA = a.finalScore || 0;
    const scoreB = b.finalScore || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (b.created || 0) - (a.created || 0);
   });

   html += `
   <div class="job-kanban-section mb-4" style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:var(--radius); padding:1.5rem; margin-bottom: 2rem; width:100%; max-width:100%;">
    <h3 class="mb-3" style="border-bottom:1px solid var(--border); padding-bottom:.8rem; display:flex; align-items:center; justify-content:space-between">
     <span style="color:var(--text-bright)">💼 ${j.title}</span>
     <span class="badge badge-primary">${jobCands.length} Candidates</span>
    </h3>
    <div class="kanban-board">
   `;
   
   stages.forEach(st => {
    const stageCands = jobCands.filter(c => (c.status || c.stage || 'applied') === st.key);
    html += `
    <div class="kanban-column" 
         ondragover="App.handleKanbanDragOver(event)" 
         ondragenter="this.classList.add('dragover')" 
         ondragleave="this.classList.remove('dragover')" 
         ondrop="App.handleKanbanDrop(event, '${st.key}')"
         style="min-height: 250px; background: rgba(255, 255, 255, 0.01); padding: 0.8rem; border-radius: var(--radius-sm)">
     <div class="kanban-column-header" style="margin-bottom: 0.6rem; border-bottom: 1px solid var(--border)">
      <span style="font-size:0.75rem; font-weight:700; color:var(--text-bright)">${st.icon} ${st.label}</span>
      <span class="kanban-column-count" style="font-size:0.7rem; padding:0.1rem 0.4rem">${stageCands.length}</span>
     </div>
     <div class="kanban-card-list" style="display:flex; flex-direction:column; gap:0.5rem; min-height: 180px;">
      ${stageCands.map(c => {
       const badge=getBadge(c.finalScore||0);
       return `
       <div class="kanban-card" 
            draggable="true" 
            ondragstart="App.handleKanbanDragStart(event, '${c.id}')" 
            onclick="App.viewCandidate('${c.id}')"
            style="padding: 0.8rem; background: rgba(10, 11, 30, 0.6); border-radius: var(--radius-sm)">
        <div class="kanban-card-title" style="font-size:0.85rem">${c.name}</div>
        
        <div class="kanban-card-meta" style="margin-top:0.4rem">
         ${c.finalScore ? `<span class="badge ${badge.cls}" style="font-size:0.6rem;padding:0.05rem 0.25rem">${c.finalScore}</span>` : '<span style="color:var(--text-dim);font-size:0.6rem">Unscored</span>'}
         <span class="kanban-card-date" style="font-size:0.65rem">${new Date(c.created).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
        </div>
        
        ${c.tags && c.tags.length ? `
        <div class="candidate-tags" style="margin-top:0.4rem; gap:0.25rem">
         ${c.tags.slice(0, 2).map(t => `<span class="tag ${t.type}" style="font-size:0.5rem; padding:0.05rem 0.2rem">${t.text}</span>`).join('')}
         ${c.tags.length > 2 ? `<span style="font-size:0.55rem; color:var(--text-dim)">+${c.tags.length-2}</span>` : ''}
        </div>` : ''}
       </div>`;
      }).join('')}
     </div>
    </div>`;
   });

     html += `</div></div>`;
  });

   const jobIds = jobs.map(j => j.id);
   const unassignedCands = cands.filter(c => !c.jobId || !jobIds.includes(c.jobId));
  if (unassignedCands.length) {
   unassignedCands.sort((a, b) => {
    const scoreA = a.finalScore || 0;
    const scoreB = b.finalScore || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (b.created || 0) - (a.created || 0);
   });

   html += `
   <div class="job-kanban-section mb-4" style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:var(--radius); padding:1.5rem; margin-bottom: 2rem; width:100%; max-width:100%;">
    <h3 class="mb-3" style="border-bottom:1px solid var(--border); padding-bottom:.8rem; display:flex; align-items:center; justify-content:space-between">
     <span style="color:var(--text-bright)">General / Unassigned</span>
     <span class="badge badge-primary">${unassignedCands.length} Candidates</span>
    </h3>
    <div class="kanban-board">
   `;

   stages.forEach(st => {
    const stageCands = unassignedCands.filter(c => (c.status || c.stage || 'applied') === st.key);
    html += `
    <div class="kanban-column" 
         ondragover="App.handleKanbanDragOver(event)" 
         ondragenter="this.classList.add('dragover')" 
         ondragleave="this.classList.remove('dragover')" 
         ondrop="App.handleKanbanDrop(event, '${st.key}')"
         style="min-height: 250px; background: rgba(255, 255, 255, 0.01); padding: 0.8rem; border-radius: var(--radius-sm)">
     <div class="kanban-column-header" style="margin-bottom: 0.6rem; border-bottom: 1px solid var(--border)">
      <span style="font-size:0.75rem; font-weight:700; color:var(--text-bright)">${st.icon} ${st.label}</span>
      <span class="kanban-column-count" style="font-size:0.7rem; padding:0.1rem 0.4rem">${stageCands.length}</span>
     </div>
     <div class="kanban-card-list" style="display:flex; flex-direction:column; gap:0.5rem; min-height: 180px;">
      ${stageCands.map(c => {
       const badge=getBadge(c.finalScore||0);
       return `
       <div class="kanban-card" 
            draggable="true" 
            ondragstart="App.handleKanbanDragStart(event, '${c.id}')" 
            onclick="App.viewCandidate('${c.id}')"
            style="padding: 0.8rem; background: rgba(10, 11, 30, 0.6); border-radius: var(--radius-sm)">
        <div class="kanban-card-title" style="font-size:0.85rem">${c.name}</div>
        
        <div class="kanban-card-meta" style="margin-top:0.4rem">
         ${c.finalScore ? `<span class="badge ${badge.cls}" style="font-size:0.6rem;padding:0.05rem 0.25rem">${c.finalScore}</span>` : '<span style="color:var(--text-dim);font-size:0.6rem">Unscored</span>'}
         <span class="kanban-card-date" style="font-size:0.65rem">${new Date(c.created).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
        </div>
        
        ${c.tags && c.tags.length ? `
        <div class="candidate-tags" style="margin-top:0.4rem; gap:0.25rem">
         ${c.tags.slice(0, 2).map(t => `<span class="tag ${t.type}" style="font-size:0.5rem; padding:0.05rem 0.2rem">${t.text}</span>`).join('')}
         ${c.tags.length > 2 ? `<span style="font-size:0.55rem; color:var(--text-dim)">+${c.tags.length-2}</span>` : ''}
        </div>` : ''}
       </div>`;
      }).join('')}
     </div>
    </div>`;
   });

   html += `</div></div>`;
  }
 } else {
  // List view
  jobs.forEach(j => {
   const jobCands = cands.filter(c => c.jobId === j.id);
   jobCands.sort((a, b) => {
    const scoreA = a.finalScore || 0;
    const scoreB = b.finalScore || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (b.created || 0) - (a.created || 0);
   });

   html += `
   <div class="job-section mb-3" style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:var(--radius); padding:1.5rem; margin-bottom: 2rem;">
    <h3 class="mb-2" style="border-bottom:1px solid var(--border); padding-bottom:.8rem; display:flex; align-items:center; justify-content:space-between">
     <span style="color:var(--text-bright)">💼 ${j.title}</span>
     <span class="badge badge-primary">${jobCands.length} Candidates</span>
    </h3>
    <div class="grid grid-2 mt-2">
     ${jobCands.map((c, idx) => renderCard(c, idx >= 10, j.id)).join('')}
     ${jobCands.length > 10 ? `
      <div class="show-all-container" style="grid-column:1/-1; text-align:center; margin-top:1.5rem;">
       <button class="btn btn-secondary w-full" style="justify-content:center" onclick="document.querySelectorAll('.hidden-cand-${j.id}').forEach(el=>el.classList.remove('hidden')); this.parentElement.remove();">Show All (${jobCands.length - 10} more) →</button>
      </div>
     ` : ''}
     ${!jobCands.length ? `<div class="empty-state" style="grid-column:1/-1; padding:1.5rem"><p class="text-dim">No candidates applied for this position yet.</p></div>` : ''}
    </div>
   </div>`;
  });

  const jobIds = jobs.map(j => j.id);
  const unassignedCands = cands.filter(c => !c.jobId || !jobIds.includes(c.jobId));
  if (unassignedCands.length) {
   unassignedCands.sort((a, b) => {
    const scoreA = a.finalScore || 0;
    const scoreB = b.finalScore || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (b.created || 0) - (a.created || 0);
   });

   html += `
   <div class="job-section mb-3" style="background:rgba(255,255,255,0.01); border:1px solid var(--border); border-radius:var(--radius); padding:1.5rem; margin-bottom: 2rem;">
    <h3 class="mb-2" style="border-bottom:1px solid var(--border); padding-bottom:.8rem; display:flex; align-items:center; justify-content:space-between">
     <span style="color:var(--text-bright)">👥 General / Unassigned</span>
     <span class="badge badge-primary">${unassignedCands.length} Candidates</span>
    </h3>
    <div class="grid grid-2 mt-2">
     ${unassignedCands.map((c, idx) => renderCard(c, idx >= 10, 'unassigned')).join('')}
     ${unassignedCands.length > 10 ? `
      <div class="show-all-container" style="grid-column:1/-1; text-align:center; margin-top:1.5rem;">
       <button class="btn btn-secondary w-full" style="justify-content:center" onclick="document.querySelectorAll('.hidden-cand-unassigned').forEach(el=>el.classList.remove('hidden')); this.parentElement.remove();">Show All (${unassignedCands.length - 10} more) →</button>
      </div>
     ` : ''}
    </div>
   </div>`;
  }
 }

 return html;
},

interviews(){
 const ints=Store.get('interviews',[]),cands=Store.get('candidates',[]);
 const now=new Date(),yr=now.getFullYear(),mo=now.getMonth();
 const daysInMonth=new Date(yr,mo+1,0).getDate(),firstDay=new Date(yr,mo,1).getDay();
 const monthName=now.toLocaleString('default',{month:'long',year:'numeric'});
 const intDates=ints.map(i=>new Date(i.date).getDate());
 return `
 <div class="section-header"><h2 class="section-title">📅 Interviews</h2>
  <button class="btn btn-primary" onclick="App.showInterviewForm()">+ Schedule Interview</button></div>
 <div class="grid grid-2">
  <div class="card" style="padding:1.5rem">
   <h3 class="mb-2 text-center">${monthName}</h3>
   <div class="calendar-grid">
    ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="calendar-cell header">${d}</div>`).join('')}
    ${Array(firstDay).fill('<div class="calendar-cell empty"></div>').join('')}
    ${Array.from({length:daysInMonth},(_,i)=>{const day=i+1;const isToday=day===now.getDate();const hasEvt=intDates.includes(day);
     return `<div class="calendar-cell${isToday?' today':''}${hasEvt?' has-event':''}">${day}</div>`}).join('')}
   </div>
  </div>
  <div class="card">
   <h3 class="mb-2">Upcoming Interviews</h3>
   ${ints.length?ints.sort((a,b)=>a.date-b.date).map(i=>{const c=cands.find(c=>c.id===i.candidateId);
    return `<div class="checklist-item" style="padding:0.75rem 0; border-bottom:1px solid var(--border)">
     <div style="display:flex; align-items:center; gap:10px; flex:1">
      <div class="checklist-check">📅</div>
      <div class="checklist-text"><strong>${c?c.name:'Unknown'}</strong><br><span class="text-dim text-sm">${new Date(i.date).toLocaleString()} · ${i.type||'Video Call'}</span></div>
     </div>
     <div class="flex gap-1" style="align-items:center">
         <button class="btn btn-sm btn-secondary" onclick="App.genQuestions('${i.candidateId}')">AI Questions</button>
         ${c && c.status === 'interview_scheduled' ? `<button class="btn btn-sm btn-success" onclick="App.showLogOutcomeModal('${c.id}')">Outcome</button>` : ''}
         <button class="btn btn-sm btn-danger" onclick="App.deleteInterview('${i.id}')">✕</button>
     </div>
    </div>`}).join(''):'<div class="empty-state"><div class="empty-state-icon">📅</div><p>No interviews scheduled</p></div>'}
  </div>
 </div>`;
},

chatbot() {
  return `
  <div class="section-header">
   <h2 class="section-title">🤖 AI Recruitment Assistant</h2>
   <button class="btn btn-secondary btn-sm" onclick="App.navigate('dashboard')">Close Chat</button>
  </div>
  <div class="card chat-container">
   <div class="chat-messages" id="chat-messages">
    <div class="chat-msg ai">👋 Hi! I'm your HR AI assistant. Ask me about candidates, interview prep, HR policies, or click a quick action below!</div>
   </div>
   <div style="padding: 1rem; border-top: 1px solid var(--border);">
       <div class="chat-suggestions" style="display:flex; gap:.5rem; margin-bottom:1rem; flex-wrap:wrap">
         <button class="btn btn-sm btn-secondary" onclick="App.sendChat('Give me a summary of our current candidates.')">👥 Candidates Summary</button>
         <button class="btn btn-sm btn-secondary" onclick="App.sendChat('What upcoming interviews do I have scheduled?')">📅 My Interviews</button>
         <button class="btn btn-sm btn-secondary" onclick="App.sendChat('List all active job postings.')">💼 Active Jobs</button>
       </div>
       <div class="chat-input-wrap">
        <input type="text" id="chat-input" placeholder="Ask anything about HR..." onkeydown="if(event.key==='Enter')App.sendChat()">
        <button class="btn btn-primary" onclick="App.sendChat()">Send</button>
       </div>
   </div>
  </div>`;
},

onboarding(){
 const items=Store.get('onboarding',[]);
 return `
 <div class="section-header"><h2 class="section-title">🎯 Onboarding Tracker</h2>
  <button class="btn btn-primary" onclick="App.showOnboardingForm()">+ New Hire</button></div>
 ${items.length?items.map(ob=>{
  const allDone = ob.tasks.every(t=>t.done);
  const progress = ob.tasks.length ? Math.round((ob.tasks.filter(t=>t.done).length / ob.tasks.length) * 100) : 0;
  
  // Find candidate to check doc verification status
  const cands = Store.get('candidates', []);
  const c = cands.find(cand => cand.id === ob.candidateId) || {};
  const docsChecked = c.onboarding?.docsChecked || false;
  const joiningStatus = c.onboarding?.joiningStatus || (allDone ? 'Boarded' : 'Pending Contract');
  
  return `<div class="card mb-2" style="${allDone ? 'border-left: 4px solid var(--success); opacity: 0.9;' : 'border-left: 4px solid var(--primary)'}">
  <div class="flex-between mb-2" style="flex-wrap: wrap; gap: 0.5rem">
      <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-sm" style="background:transparent;padding:0;font-size:1.2rem;cursor:pointer" onclick="const t=document.getElementById('tasks-${ob.candidateId}'); t.style.display=t.style.display==='none'?'block':'none'; this.textContent=t.style.display==='none'?'▼':'▲'">▼</button>
          <h3 style="margin:0">${ob.name} <span class="text-dim text-sm" style="font-weight:normal"> — ${ob.role||''}</span></h3>
      </div>
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px">
          <span class="badge ${allDone ? 'badge-success' : 'badge-primary'}">${allDone ? '✅ Boarded' : progress+'% complete'}</span>
          <span class="badge badge-secondary" style="font-size: 0.7rem;">${joiningStatus}</span>
          <button class="btn btn-sm ${docsChecked ? 'btn-success' : 'btn-secondary'}" style="font-size:0.7rem; padding:0.3rem 0.6rem" onclick="App.toggleOnboardingDocs('${ob.candidateId}')">
              ${docsChecked ? '✓ Docs Verified' : 'Verify Docs'}
          </button>
          ${!allDone ? `<button class="btn btn-sm btn-success" style="font-size:0.7rem; padding:0.3rem 0.6rem; background:var(--success); border-color:var(--success)" onclick="App.completeOnboardingManual('${ob.candidateId}')">Complete Onboarding</button>` : ''}
          <button class="btn btn-sm btn-danger" style="padding:0.3rem .5rem" title="Remove" onclick="App.deleteOnboarding('${ob.candidateId}')">✕</button>
      </div>
  </div>
  <div class="score-bar mb-2"><div class="score-bar-fill ${allDone ? 'success' : 'default'}" style="width:${progress}%; ${allDone?'background:var(--success)':''}"></div></div>
  
  <div id="tasks-${ob.candidateId}" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border)">
      ${ob.tasks.map((t,i)=>`<div class="checklist-item ${t.done?'done':''}">
       <div class="checklist-check ${t.done?'checked':''}" onclick="App.toggleTask('${ob.candidateId}',${i})">${t.done?'✓':''}</div>
       <span class="checklist-text ${t.done?'done-text':''}">${t.text}</span>
      </div>`).join('')}
  </div>
 </div>`}).join(''):'<div class="empty-state"><div class="empty-state-icon">🎯</div><p>No onboarding workflows yet</p></div>'}`;
},

settings(){
 const s=Store.get('settings',{});
 return `
 <div class="section-header"><h2 class="section-title">⚙️ Settings</h2></div>
 <div class="grid grid-2">
  <div class="card" style="padding:2rem">
   <h3 class="mb-2">🏢 Company Profile</h3>
   <div class="form-group mb-2"><label>Company Name</label><input type="text" id="set-company" value="${s.companyName||''}"></div>
   <div class="form-group mb-2"><label>Core Values (comma-separated)</label><input type="text" id="set-values" value="${(s.cultureValues||[]).join(', ')}"></div>
   <button class="btn btn-primary" onclick="App.saveSettings()">Save Profile</button>
  </div>
  <div class="card" style="padding:2rem">
   <h3 class="mb-2">📧 EmailJS Configuration</h3>
   <div class="form-group mb-2"><label>Service ID</label><input type="text" id="set-ejs-svc" value="${s.emailServiceId||CONFIG.EMAILJS_SERVICE}"></div>
   <div class="form-group mb-2"><label>Public Key</label><input type="text" id="set-ejs-key" value="${s.emailKey||CONFIG.EMAILJS_KEY}"></div>
   <div class="form-group mb-2"><label>Application Template ID (Master)</label><input type="text" id="set-ejs-tpl-app" value="${s.emailTemplateApp||CONFIG.EMAILJS_TEMPLATE_APP}" placeholder="Enter Application Template ID"></div>
   <div class="form-group mb-2"><label>Interview Template ID (Optional)</label><input type="text" id="set-ejs-tpl-int" value="${s.emailTemplateInt||CONFIG.EMAILJS_TEMPLATE_INT}" placeholder="Enter Interview Template ID"></div>
   <div class="text-sm text-dim mt-1">Free Tier Tip: You can use ONE master template with {{message}}, or two separate templates for different designs.</div>
   <button class="btn btn-primary mt-2" onclick="App.saveSettings()">Save Email Settings</button>
  </div>
  <div class="card" style="padding:2rem">
   </div>
   <h3 class="mb-2">💾 Data Management</h3>
   <div class="flex gap-1 mb-2">
    <button class="btn btn-secondary w-full" onclick="App.exportData()">📤 Export JSON</button>
    <button class="btn btn-secondary w-full" onclick="App.exportCSV()">📊 Export CSV</button>
   </div>
   <div class="form-group"><label>Import JSON Backup</label><input type="file" id="import-file" accept=".json" onchange="App.importData(event)"></div>
   <button class="btn btn-danger mt-2 w-full" onclick="App.resetAllData()">🗑️ Reset All Data</button>
  </div>
 </div>`;
},

scorecard(c){
    const badge = getBadge(c.finalScore || 0);
    const resumeScore = Math.round(((c.atsScore || 0) * 0.36) + ((c.skillsScore || 0) * 0.64));
    const assessmentScore = c.personalityScores?._overall || 0;
    const dims = c.personalityScores ? Object.entries(c.personalityScores).filter(([k]) => k !== '_overall') : [];

    return `
    <div class="flex-between mb-2">
        <h2 style="margin:0">${c.name}</h2>
        <button class="btn btn-primary btn-sm" onclick="App.downloadReport('${c.id}')">📄 Download Full Report</button>
    </div>
    <p class="text-dim mb-3">${c.jobTitle || ''} · ${c.email || ''} · Applied: ${new Date(c.created).toLocaleDateString()}</p>
    
    <div class="view-tabs-responsive mb-3" style="background:rgba(255,255,255,0.03); padding:0.25rem; border-radius:var(--radius-sm); border:1px solid var(--border)">
        <button class="btn btn-sm btn-primary" id="btn-sc-tab-overview" onclick="document.querySelectorAll('.sc-tab').forEach(el=>el.style.display='none'); document.getElementById('sc-tab-overview').style.display='block'; document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.remove('btn-primary')); document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.add('btn-secondary')); this.classList.remove('btn-secondary'); this.classList.add('btn-primary');" style="flex:1; font-size:0.8rem; justify-content:center">Overview</button>
        <button class="btn btn-sm btn-secondary" id="btn-sc-tab-ai" onclick="document.querySelectorAll('.sc-tab').forEach(el=>el.style.display='none'); document.getElementById('sc-tab-ai').style.display='block'; document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.remove('btn-primary')); document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.add('btn-secondary')); this.classList.remove('btn-secondary'); this.classList.add('btn-primary');" style="flex:1; font-size:0.8rem; justify-content:center">🤖 AI Insights</button>
        <button class="btn btn-sm btn-secondary" id="btn-sc-tab-timeline" onclick="document.querySelectorAll('.sc-tab').forEach(el=>el.style.display='none'); document.getElementById('sc-tab-timeline').style.display='block'; document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.remove('btn-primary')); document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.add('btn-secondary')); this.classList.remove('btn-secondary'); this.classList.add('btn-primary');" style="flex:1; font-size:0.8rem; justify-content:center">📈 Timeline</button>
        <button class="btn btn-sm btn-secondary" id="btn-sc-tab-collab" onclick="document.querySelectorAll('.sc-tab').forEach(el=>el.style.display='none'); document.getElementById('sc-tab-collab').style.display='block'; document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.remove('btn-primary')); document.querySelectorAll('.view-tabs-responsive button').forEach(b=>b.classList.add('btn-secondary')); this.classList.remove('btn-secondary'); this.classList.add('btn-primary');" style="flex:1; font-size:0.8rem; justify-content:center">👥 Collaboration</button>
    </div>

    <!-- OVERVIEW TAB -->
    <div id="sc-tab-overview" class="sc-tab">
        <div class="scorecard-metrics-grid mb-3">
            <div class="score-module">
                <div class="score-module-icon">📄</div>
                <div class="score-module-title">Resume Score</div>
                <div class="score-module-value" style="color:var(--primary)">${resumeScore ?? '—'}</div>
                <div class="score-module-weight">ATS + Skills Match</div>
                <div class="score-bar mt-1"><div class="score-bar-fill ats" style="width:${resumeScore || 0}%"></div></div>
            </div>
            <div class="score-module">
                <div class="score-module-icon">🧠</div>
                <div class="score-module-title">Assessment Score</div>
                <div class="score-module-value" style="color:var(--warning)">${assessmentScore ?? '—'}</div>
                <div class="score-module-weight">Personality & Culture</div>
                <div class="score-bar mt-1"><div class="score-bar-fill personality" style="width:${assessmentScore || 0}%"></div></div>
            </div>
            <div class="final-score-card score-module" style="grid-column: span 1;">
                <div class="final-score-value">${c.finalScore ?? '—'}</div>
                <div style="font-size:0.7rem; font-weight:700; letter-spacing:0.05em">FINAL COMPOSITE</div>
                ${badge ? `<span class="final-score-badge ${badge.cls}" style="font-size:0.7rem; padding:0.2rem 0.5rem">${badge.label}</span>` : ''}
            </div>
        </div>

        ${dims.length?`<div class="card mb-3" style="padding:1.2rem; background:rgba(0,0,0,0.15)"><h3 class="mb-2" style="font-size:0.95rem">🧠 Personality Breakdown</h3>
        ${dims.map(([k,v])=>`<div class="score-bar-wrap"><div class="score-bar-label"><span>${DIMENSION_LABELS[k]||k}</span><span>${v}/100</span></div>
        <div class="score-bar"><div class="score-bar-fill personality" style="width:${v}%"></div></div></div>`).join('')}</div>`:''}

        <div class="card mb-3" style="padding:1.2rem; background:rgba(0,0,0,0.15)">
            <div class="flex-between cursor-pointer" onclick="const x=document.getElementById('raw-resume-${c.id}'); x.style.display=x.style.display==='none'?'block':'none';">
                <h3 style="margin:0; font-size:0.95rem">📄 Raw Resume Text</h3>
                <span class="text-dim text-sm">Click to expand ▼</span>
            </div>
            <div id="raw-resume-${c.id}" style="display:none;margin-top:1rem">
                <textarea readonly rows="6" style="width:100%;font-size:.8rem;color:var(--text-dim);background:rgba(0,0,0,0.2);padding:1rem;border:1px solid var(--border)">${c.resumeText || 'No text extracted.'}</textarea>
            </div>
        </div>

        ${c.quizLog ? `
        <div class="card mb-3" style="padding:1.2rem; background:rgba(0,0,0,0.15)">
            <div class="flex-between cursor-pointer" onclick="const y=document.getElementById('quiz-log-${c.id}'); y.style.display=y.style.display==='none'?'block':'none';">
                <h3 style="margin:0; font-size:0.95rem">⏱️ Detailed Assessment Report</h3>
                <span class="text-dim text-sm">Click to expand ▼</span>
            </div>
            <div id="quiz-log-${c.id}" style="display:none;margin-top:1rem;max-height:250px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm)">
                ${c.quizLog.map((log, i) => `
                    <div style="padding:.6rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                        <div style="flex:1;padding-right:1rem">
                            <div style="margin-bottom:.3rem; font-size:0.8rem"><strong style="color:var(--text-dim)">Q${i+1}:</strong> ${log.text}</div>
                            <span style="font-size:0.7rem;color:var(--primary);background:rgba(255,255,255,0.05);padding:.15rem .3rem;border-radius:4px">${DIMENSION_LABELS[log.dimension]||log.dimension} (Score: ${log.score}/5)</span>
                        </div>
                        <div style="font-size:0.75rem;color:var(--warning);white-space:nowrap;font-weight:bold">⏱️ ${log.timeTaken}s</div>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
    </div>

    <!-- AI INSIGHTS TAB -->
    <div id="sc-tab-ai" class="sc-tab" style="display:none">
        ${c.aiAnalysis ? (c.aiAnalysis.composite ? `
            <div class="card" style="padding:1.2rem; background:rgba(0,0,0,0.15)">
                <h3 class="mb-3" style="font-size:1rem">🤖 AI Multi-Agent Analysis</h3>
                
                <div class="grid grid-2" style="gap:1rem">
                    <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border)">
                        <div class="flex-between mb-1"><strong style="font-size:0.85rem">📄 Technical Evaluation</strong> <span class="badge badge-primary">${c.aiAnalysis.technical.score}</span></div>
                        <p class="text-xs text-dim" style="line-height:1.4">${c.aiAnalysis.technical.summary}</p>
                        <div class="mt-1">${c.aiAnalysis.technical.strengths.map(s=>`<span class="tag tag-blue" style="font-size:0.6rem; padding:0.1rem 0.25rem">${s}</span>`).join(' ')}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border)">
                        <div class="flex-between mb-1"><strong style="font-size:0.85rem">🧠 Behavioral Evaluation</strong> <span class="badge badge-warning">${c.aiAnalysis.behavioral.score}</span></div>
                        <p class="text-xs text-dim" style="line-height:1.4">${c.aiAnalysis.behavioral.summary}</p>
                        <div class="mt-1">${c.aiAnalysis.behavioral.traits.map(s=>`<span class="tag tag-purple" style="font-size:0.6rem; padding:0.1rem 0.25rem">${s}</span>`).join(' ')}</div>
                    </div>
                </div>
                
                <div class="mt-3" style="padding:1rem; background:rgba(108,99,255,0.08); border-radius:var(--radius); border:1px solid var(--primary)">
                    <div class="flex-between mb-1"><strong style="font-size:0.9rem">🎯 Composite Decision Summary</strong> <span class="badge badge-success">${c.aiAnalysis.composite.score}</span></div>
                    <p style="line-height:1.5; font-size:0.85rem">${c.aiAnalysis.composite.narrative}</p>
                    <div class="mt-2" style="font-size:0.85rem"><strong>Recommendation Verdict:</strong> <span class="badge badge-primary">${c.aiAnalysis.composite.verdict}</span></div>
                    <div class="mt-2" style="font-size:0.85rem"><strong>Tailored Interview Questions:</strong>
                        <ul class="text-xs mt-1" style="padding-left:1.2rem; line-height:1.5">${c.aiAnalysis.composite.tailoredQuestions.map(q=>`<li>${q}</li>`).join('')}</ul>
                    </div>
                </div>
            </div>
        ` : `
            <div class="card" style="padding:1.2rem; background:rgba(0,0,0,0.15)">
                <h3 class="mb-2" style="font-size:1rem">🤖 AI Analysis Summary</h3>
                <p style="line-height:1.6; font-size:0.85rem">${c.aiAnalysis.summary||c.aiAnalysis.narrative||''}</p>
                ${c.aiAnalysis.strengths?`<div class="mt-2" style="font-size:0.85rem"><strong>Strengths:</strong>${c.aiAnalysis.strengths.map(s=>`<span class="tag tag-green" style="margin-left:0.25rem; font-size:0.65rem">${s}</span>`).join('')}</div>`:''}
                ${c.aiAnalysis.redFlags?.length?`<div class="mt-1" style="font-size:0.85rem"><strong>Red Flags:</strong>${c.aiAnalysis.redFlags.map(s=>`<span class="tag tag-red" style="margin-left:0.25rem; font-size:0.65rem">${s}</span>`).join('')}</div>`:''}
                <div class="mt-2" style="font-size:0.85rem"><strong>Recommendation:</strong> <span class="badge badge-primary">${c.aiAnalysis.recommendation||c.aiAnalysis.roleSpecificVerdict||'—'}</span></div>
            </div>
        `) : `
            <div class="empty-state" style="padding:2rem">
                <div class="empty-state-icon">🤖</div>
                <p style="margin-bottom:1rem">No AI Agent analysis has been run for this candidate yet.</p>
                <button class="btn btn-success" onclick="App.runAIAnalysis('${c.id}')" id="btn-ai-${c.id}">🤖 Run AI Multi-Agent Analysis</button>
            </div>
        `}
    </div>

    <!-- TIMELINE TAB -->
    <div id="sc-tab-timeline" class="sc-tab" style="display:none">
        <div class="timeline" style="margin:1rem 0; position:relative; padding-left:1.5rem; border-left:2px solid var(--border)">
            ${(c.timeline || []).map(t => `
                <div class="timeline-item" style="position:relative; margin-bottom:1.5rem">
                    <span style="position:absolute; left:-2.1rem; top:0; background:var(--background); padding:0.15rem; border-radius:50%; font-size:1.1rem">${t.icon || '📌'}</span>
                    <div style="font-size:0.7rem; color:var(--text-dim)">${new Date(t.date).toLocaleString()} · <span style="text-transform:capitalize; color:var(--primary)">${t.stage}</span></div>
                    <div style="font-size:0.8rem; font-weight:600; margin-top:0.2rem; color:var(--text-bright)">${t.label}</div>
                </div>
            `).join('')}
            ${!(c.timeline || []).length ? '<p class="text-dim text-center">No audit log timeline available yet.</p>' : ''}
        </div>
    </div>

    <!-- COLLABORATION TAB -->
    <div id="sc-tab-collab" class="sc-tab" style="display:none">
        <div class="mb-3">
            <h4 style="margin:0 0 0.5rem 0; font-size:0.9rem">Tags & Labels</h4>
            <div class="candidate-tags" style="gap:0.35rem; display:flex; flex-wrap:wrap">
                ${(c.tags || []).map(t => `
                    <span class="tag ${t.type || 'tag-blue'}" style="font-size:0.7rem; padding:0.2rem 0.5rem; display:inline-flex; align-items:center; gap:5px">
                        ${t.text} 
                        <span style="cursor:pointer; font-weight:bold; font-size:0.75rem" onclick="App.removeCandidateTag('${c.id}', '${t.text}')">✕</span>
                    </span>
                `).join('')}
                ${!(c.tags || []).length ? '<span class="text-dim text-xs">No tags yet.</span>' : ''}
            </div>
            <div style="display:flex; gap:10px; margin-top:0.75rem">
                <input type="text" id="tag-input-${c.id}" placeholder="Add standard label (e.g. Frontend, Java)..." style="flex:1; padding:0.4rem; font-size:0.8rem; background:rgba(0,0,0,0.15); border:1px solid var(--border); border-radius:var(--radius-sm)">
                <button class="btn btn-sm btn-primary" onclick="App.addCandidateTag('${c.id}', document.getElementById('tag-input-${c.id}').value)">Add Tag</button>
            </div>
        </div>

        <div style="border-top:1px solid var(--border); padding-top:1rem">
            <h4 style="margin:0 0 0.75rem 0; font-size:0.9rem">Recruiter Notes</h4>
            <div class="collab-notes-list" style="max-height:200px; overflow-y:auto; margin-bottom:1rem">
                ${(c.notes || []).map(n => `
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); padding:0.6rem 0.8rem; border-radius:var(--radius-sm); margin-bottom:0.5rem">
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:var(--text-dim); margin-bottom:0.25rem">
                            <strong>${n.author || 'Recruiter'}</strong>
                            <span>${new Date(n.date).toLocaleString()}</span>
                        </div>
                        <p style="margin:0; font-size:0.8rem; line-height:1.4">${n.text}</p>
                    </div>
                `).join('')}
                ${!(c.notes || []).length ? '<p class="text-dim text-xs text-center" style="padding:1rem 0">No recruiter collaboration notes yet.</p>' : ''}
            </div>
            <div style="display:flex; flex-direction:column; gap:5px">
                <textarea id="note-input-${c.id}" placeholder="Type feedback or evaluation notes..." rows="3" style="width:100%; padding:0.5rem; font-size:0.8rem; background:rgba(0,0,0,0.15); border:1px solid var(--border); border-radius:var(--radius-sm)"></textarea>
                <button class="btn btn-sm btn-primary" style="align-self:flex-end" onclick="App.addCandidateNote('${c.id}', document.getElementById('note-input-${c.id}').value)">Post Note</button>
            </div>
        </div>
    </div>

    <div class="flex gap-1 mt-3" style="border-top:1px solid var(--border); padding-top:1rem">
     ${['applied', 'shortlisted', 'on_hold', 'on hold'].includes(String(c.status || c.stage || '').toLowerCase()) ? `<button class="btn btn-primary" onclick="App.closeModal();App.showInterviewForm('${c.id}')">📅 Schedule Interview</button>` : ''}
     ${['interview_scheduled', 'interview_completed', 'on_hold', 'on hold'].includes(String(c.status || c.stage || '').toLowerCase()) ? `<button class="btn btn-success" onclick="App.showLogOutcomeModal('${c.id}')">📋 Log Outcome</button>` : ''}
     ${!c.aiScore?`<button class="btn btn-success" onclick="App.runAIAnalysis('${c.id}')" id="btn-ai-${c.id}">🤖 Run AI Analysis</button>`:''}
     <button class="btn btn-danger btn-sm" onclick="App.deleteCandidate('${c.id}')">✕ Remove</button>
    </div>`;
},

portal(jobId) {
 const jobs = Store.get('jobs', []);
 const job = jobs.find(j => j.id === jobId);
 if (!job) return `<div class="empty-state"><h2>Job Not Found</h2><p>This position may have been closed.</p></div>`;
 
 return `
 <div class="portal-outer">
  <div class="card portal-card">
   <div id="portal-intro">
    <div class="text-center mb-3">
     <h1 style="margin-bottom:.5rem">${job.title}</h1>
     <p class="text-dim">${job.department} · ${job.location} · ${job.type}</p>
    </div>
    <p style="line-height:1.6; margin-bottom: 2rem">${job.description}</p>
   </div>
   
   <div id="guidelines-section" style="background: rgba(108, 99, 255, 0.05); padding: 1.5rem; border-radius: var(--radius); margin-bottom: 2rem; border: 1px solid var(--border);">
       <h3 class="mb-2">📋 Assessment Guidelines & Procedures</h3>
       <ul style="padding-left: 1.5rem; line-height: 1.6; color: var(--text-dim);">
           <li><strong>Step 1:</strong> Fill out your personal details and upload your latest resume.</li>
           <li><strong>Step 2:</strong> Take the 30-question Personality & Culture Fit Assessment.</li>
           <li><strong>Dynamic Timing:</strong> The faster you answer a question, the less time you will get for upcoming questions. We measure your natural instincts.</li>
           <li><strong>Honesty:</strong> Please answer honestly to ensure the best culture fit for both you and us.</li>
       </ul>
       <div class="mt-3" style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.1); padding: 1rem; border-radius: var(--radius-sm);">
           <input type="checkbox" id="verify-guidelines" onchange="if(this.checked){ document.getElementById('application-form').style.display='block'; document.getElementById('guidelines-section').style.display='none'; document.getElementById('portal-intro').style.display='none'; }" style="width:20px;height:20px;accent-color:var(--primary);cursor:pointer;">
           <label for="verify-guidelines" style="cursor:pointer; user-select:none; font-weight:600;">I have read and agree to the guidelines</label>
       </div>
   </div>

   <div id="application-form" style="display: none;">
       <h3 class="mb-2">Your Details</h3>
       <div class="form-group mb-2"><label>Full Name *</label><input type="text" id="app-name" placeholder="John Doe"></div>
       <div class="form-group mb-2"><label>Email Address *</label><input type="email" id="app-email" placeholder="john@example.com"></div>
       <div class="form-group mb-2"><label>Phone Number</label><input type="tel" id="app-phone" placeholder="+1 234 567 8900"></div>
       
       <div class="form-group mb-3"><label>Upload Resume (PDF) *</label>
        <div class="upload-zone" id="app-upload-zone" onclick="document.getElementById('app-resume').click()" style="padding: 2rem;">
         <div class="upload-zone-icon" style="font-size: 2rem; margin-bottom: .5rem">📄</div>
         <div class="upload-zone-text" id="app-upload-text">Click to select PDF resume</div>
         <input type="file" id="app-resume" accept=".pdf" style="display:none" onchange="document.getElementById('app-upload-text').textContent = this.files[0] ? this.files[0].name : 'Click to select PDF resume'">
        </div>
       </div>
       
       <div id="app-progress" class="mb-2"></div>
       <button id="submit-app-btn" class="btn btn-primary btn-lg w-full" style="justify-content:center" onclick="App.submitInitialApplication('${job.id}')">Submit Application</button>
       <div id="take-assessment-container" style="display:none; margin-top: 1rem;">
           <button class="btn btn-primary btn-lg w-full" style="justify-content:center; background: var(--success); color: white; border-color: var(--success);" onclick="App.startAssessment('${job.id}')">Take Assessment →</button>
       </div>
   </div>
  </div>
 </div>`;
}
};
