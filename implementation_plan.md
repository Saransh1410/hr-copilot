# Autonomous HR Agent — Updated Implementation Plan (v2)

A browser-based, zero-backend HR copilot with **multi-dimensional candidate scoring** — resume skills, ATS quality, personality fit, and AI holistic analysis — all shown as separate scores with a final composite.

---

## 🏆 The Scoring System (Core Innovation)

### 4 Independent Score Modules → 1 Final Score

```
┌─────────────────────────────────────────────────────────┐
│              CANDIDATE SCORECARD                        │
├──────────────────┬──────────────────────────────────────┤
│ 📄 ATS Score     │ 78/100  ██████████░░  (20% weight)   │
│ 🎯 Skills Match  │ 85/100  ████████████  (35% weight)   │
│ 🧠 Personality   │ 72/100  ██████████░░  (25% weight)   │
│ 🤖 AI Holistic   │ 81/100  ████████████  (20% weight)   │
├──────────────────┼──────────────────────────────────────┤
│ 🏅 FINAL SCORE   │ 79.6/100  →  🥈 STRONG CANDIDATE     │
└──────────────────┴──────────────────────────────────────┘
```

---

### Module 1 — 📄 ATS Score (20%)
Evaluates the **resume document itself**:
- Keyword density vs. job description
- Section detection (Contact, Summary, Experience, Education, Skills)
- Formatting quality (no tables/graphics that confuse parsers)
- Action verb usage, quantified achievements
- Length & readability score

---

### Module 2 — 🎯 Skills & Requirement Match (35%)
Evaluates **job fit**:
- Must-have skills present? (binary — yes/no per skill)
- Nice-to-have skills match (weighted partial credit)
- Years of experience extraction vs. required
- Education level match
- Industry/domain relevance

---

### Module 3 — 🧠 Personality & Culture Fit (25%)

#### How it works:
1. Candidate receives a **link to the in-app quiz**
2. Completes **30 adaptive questions** (takes ~8 minutes)
3. AI analyzes answers against company culture profile

#### Personality Dimensions Measured:

| Dimension | What It Tests |
|---|---|
| **Openness** | Creativity, curiosity, adaptability |
| **Conscientiousness** | Organization, reliability, work ethic |
| **Extraversion** | Communication, team energy, leadership |
| **Agreeableness** | Collaboration, empathy, conflict resolution |
| **Emotional Stability** | Stress handling, composure under pressure |
| **Culture Fit** | Alignment with YOUR company values (custom) |

#### Sub-scores shown separately:
```
Personality Breakdown:
  Openness          ████████░░  80
  Conscientiousness █████████░  88
  Extraversion      ██████░░░░  62
  Agreeableness     ███████░░░  74
  Emotional Stability ████████░  79
  Culture Fit       █████████░  85
  ──────────────────────────────
  Personality Score:   78/100
```

---

### Module 4 — 🤖 AI Holistic Score (20%)
Groq AI reads the full resume + personality results and gives:
- Overall narrative assessment
- Red flags detected
- Strengths highlighted
- Role-specific suitability verdict
- Comparison vs. other candidates in the pool

---

## Final Candidate Profile View

```
┌───────────────────────────────────────────────────────────┐
│  John Smith  •  Senior Python Developer  •  Applied: Today │
├───────────────────────────────────────────────────────────┤
│  📄 ATS         78   🎯 Skills     85                     │
│  🧠 Personality 72   🤖 AI Score   81                     │
│                                                           │
│  🏅 FINAL: 79.6/100  ←  🥈 STRONG CANDIDATE              │
│                                                           │
│  ✅ 6 yrs Python  ✅ AWS Certified  ⚠️ No Kubernetes      │
│  🧠 High Conscientiousness  ⚠️ Low Extraversion           │
│                                                           │
│  AI Summary: "Strong technical background with excellent  │
│  reliability traits. May need support in team-facing      │
│  roles. Recommend for technical interview."               │
│                                                           │
│  [Schedule Interview] [View Full Report] [Compare] [✗]   │
└───────────────────────────────────────────────────────────┘
```

---

## Full Feature Set

| Feature | Detail |
|---|---|
| **Resume Parsing** | PDF.js text extraction, batch upload |
| **ATS Scoring** | 20-point automated checklist |
| **Skills Matching** | Per-job configurable weights |
| **Personality Quiz** | 30 adaptive questions, Big Five + Culture Fit |
| **AI Ranking** | Groq holistic analysis per candidate |
| **Composite Scorecard** | 4 scores + weighted final |
| **Interview Scheduler** | Calendar + auto email invites |
| **AI Interview Questions** | Role + personality-tailored question bank |
| **Candidate Chatbot** | 24/7 AI assistant for candidates |
| **Onboarding Workflows** | Task checklists, progress tracking |

---

## Pages / Tabs

| Tab | Content |
|---|---|
| **Dashboard** | Pipeline funnel, KPIs, recent activity |
| **Jobs** | Create jobs, define skill weights, culture values |
| **Candidates** | Upload resumes → full scorecard per candidate |
| **Quiz** | Personality quiz builder + candidate quiz link |
| **Interviews** | Calendar + AI question bank |
| **Chatbot** | AI chat for HR or candidates |
| **Onboarding** | New hire workflow tracker |
| **Settings** | Groq key, EmailJS, company profile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | HTML + Vanilla CSS (Glassmorphism dark) |
| Resume Parsing | PDF.js (in-browser) |
| AI Scoring | Groq API (llama-3.3-70b) |
| Personality Quiz | Custom adaptive quiz engine (JS) |
| Email | EmailJS (optional) |
| **UI** | HTML5 + CSS3 (Glassmorphism / Dark Mode) |
| **Logic** | Vanilla JavaScript (ES6+) |
| **Database** | **Firebase Firestore (Real-time Cloud Sync)** |
| **AI Scoring** | Groq API (Llama-3.3-70b-versatile) |
| **Resume Parsing** | PDF.js (Client-side text extraction) |
| **Email** | EmailJS (Automated Candidate Invitations) |
| **Hosting** | Firebase Hosting |

---

## 🏆 Final Feature Set (Implemented)

| Feature | Detail |
|---|---|
| **Cloud Sync** | Real-time data sharing across all devices via Firebase Firestore. |
| **Resume Parsing** | Strict text extraction with anti-spam/garbage document filtering. |
| **Multi-Scorecard** | Independent scores for ATS, Skills, Personality, and AI Analysis. |
| **Adaptive Quiz** | 30-question assessment with a strict **15-minute time window**. |
| **Detailed Reports** | Per-question timing logs and raw resume text view for HR. |
| **AI Copilot** | Context-aware HR assistant that knows your jobs, candidates, and stats. |
| **Interview Engine** | AI-generated tailored questions + EmailJS automated invites. |
| **Onboarding** | Accordion-style task tracker for new hires with progress badges. |
| **Authentication** | Secure Sign In/Up and Google Login via Firebase Auth. |
| **Resume Downloads** | PDF storage (as Data URL) and retrieval for recruiters. |
| **AI Guide** | Floating chatbot guide on login page to assist new users. |

---

---

## 🚀 Deployment & Scaling
- **Hosting:** Deployed on Firebase Hosting.
- **Security:** "Test Mode" Firestore rules enabled for rapid prototyping.
- **Scaling:** Uses Firebase Free Tier (50k reads/20k writes per day).

---

## 🔒 Multi-User Data Architecture
To ensure data privacy and isolation between different HR accounts on the same device:

- **UID-Scoped Storage:** All data (Jobs, Candidates, Settings) is stored in Firestore under `users/{uid}/appData/{key}`.
- **Cache Isolation:** The in-browser `Store` object uses `uid + '_' + key` for both memory cache and LocalStorage keys.
- **Session Cleanup:** Logging out triggers an explicit `Store.clear()` to wipe memory before page reload.
- **Demo Isolation:** The "Try Demo" feature uses a dedicated `demo_user` UID to prevent sample data from merging with real user accounts.
- **Cloud-First Sync:** `onSnapshot` listeners ensure that when a user logs in, their specific cloud data is pulled and cached instantly, overriding any stale local state.

---

## 📁 File Structure
- `index.html`: Main entry point & layout.
- `app.js`: Core app logic, routing, and Firebase/EmailJS handlers.
- `data.js`: Firebase config, Store logic, and Question Bank.
- `pages.js`: UI Renderers for all tabs and the Candidate Scorecard.
- `quiz.js`: Adaptive assessment engine with timing & cloud save.
- `scoring.js`: ATS scoring logic and Skills matching algorithm.
- `groq.js`: AI analysis prompts and Groq API integration.
- `styles.css`: Premium Glassmorphism design system.

---

## Design System

| Token | Value |
|---|---|
| Primary | `#6C63FF` (electric violet) |
| Secondary | `#00D4AA` (mint accent) |
| Background | `#0A0B1E` (deep navy) |
| Font | Inter (Google Fonts) |
| Style | Glassmorphism cards, animated score bars |

---

## Open Questions

> [!IMPORTANT]
> **Production API Keys**: Need to ensure environment variables are configured for secure Firestore and Groq access.

> [!IMPORTANT]
> **Data Privacy**: Reviewing data retention policies for candidate resumes stored in Firestore.

> [!NOTE]
> **Analytics**: Considering integration of Firebase Analytics to track candidate flow.
