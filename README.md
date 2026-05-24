# 🚀 HR Copilot: Enterprise AI Applicant Tracking System (ATS)

HR Copilot is a state-of-the-art, fully autonomous AI recruitment operating system designed to transform hiring from fragmented, disconnected modules into a status-driven, centralized candidate lifecycle pipeline. Built with a dark glassmorphism design, it integrates resume parsing, personality analytics, automated communications, interactive testing, and deep Llama-3 AI matching into one unified recruiter workspace.

---

## 🌟 Core Architecture & Unified Workflow

Unlike traditional recruitment tools with siloed records, HR Copilot operates on a **single candidate collection/database** as the source of truth. Every applicant's journey is governed by a dynamic status field, ensuring seamless real-time updates across the dashboard, calendar, and workflows without duplicate data entry.

### The Unified Candidate Lifecycle:
```
[Applied] ──> [Screening] ──> [Shortlisted] ──> [Interview Scheduled] ──> [Interview Completed] ──> [Selected] ──> [Onboarding] ──> [Hired]
                                                    │
                                                    └─> [Rejected] / [On Hold] / [Withdrawn] (Optional States)
```

---

## 🚀 Key Platform Features & Functionalities

### 1. Dynamic Status-Driven ATS Section
*   **Active Pool Isolation:** The **Candidates** tab focuses exclusively on active top-of-funnel applicants (`Applied`, `Screening`, `Shortlisted`), keeping the focus on new talent.
*   **Automatic Handshakes:** Scheduling an interview or confirming a hire updates the status dynamically, moving candidates to their respective workspaces instantly.

### 2. Modern Drag-and-Drop Kanban Recruitment Board
*   **ATS Board Layout:** An interactive Kanban pipeline view structured into 8 key columns: **Applied**, **Screening**, **Shortlisted**, **Interview Scheduled**, **Interview Completed**, **Selected**, **Onboarding**, and **Hired**.
*   **Recruiter Interaction:** Recruiters can drag candidate cards to instantly transition their hiring lifecycle.
*   **Contextual Triggers:** 
    *   Dragging a candidate to **Interview Scheduled** automatically opens the interview scheduling modal.
    *   Dragging to **Selected** or **Onboarding** initializes the onboarding checklist.
    *   Dragging to **Hired** completes all remaining onboarding tasks automatically.
*   **Audit timeline**: Dropping a card instantly logs the transition to the candidate's history feed.

### 3. Integrated Candidate Timeline System
*   **Chronological Activity Feed:** Every single profile tracks its own lifecycle event history.
*   **Automated Logging:** Logs are recorded for initial submission, assessment completion, AI parsing, interview scheduling, evaluation notes, and onboarding tasks completion.

### 4. Recruiter Notes & Collaborative Tagging
*   **Collaboration Feed:** Recruiters can add comments, notes, and technical review logs directly on candidate profiles.
*   **Smart Tagging:** Color-coded tags (e.g. `✅ Demo`, `⚠️ Skill Gap`, `Star Candidate`) can be pinned to cards for quick identification in the pipelines.

### 5. Multi-Agent AI Composite Scoring (Groq Llama-3)
Candidates are scored out of 100 on a multi-agent composite scoring system:
*   **📄 ATS Match (20% weight):** Assesses formatting, structure, and action verbs.
*   **🎯 Skills Match (35% weight):** Measures hard skills against the job requirements.
*   **🧠 Personality Fit (25% weight):** Assesses Big Five traits and company culture alignment.
*   **🤖 AI Joint Verdict (20% weight):** An overall evaluation from Llama-3 analyzing how the candidate's technical credentials align with their behavioral style.

### 6. Interactive Candidate Assessment Portal
*   **Candidate Portal link:** Recruiters copy and share an application URL specific to each job.
*   **Guided Procedures:** Candidates review expectations and agree to guidelines before applying.
*   **Adaptive Personality Test:** A 30-question assessment measuring Big Five traits + Culture fit.
*   **Anti-Cheat Speed-Control:** An adaptive timer adjusts based on response speeds to capture natural instincts.
*   **Detailed Proctoring Logs:** Tracks the exact time in seconds spent on every question to identify suspicious behavior.

### 7. End-to-End Interview Suite
*   **Scheduler Modal:** Schedules Phone, Video, or In-Person interviews, assigns interviewers, and saves scheduling notes.
*   **AI Question Generator:** Automatically drafts 8 tailored technical/behavioral questions based on the candidate's specific background and resume.
*   **Outcome Actions:** Recruiters record final interview reviews and designate them as Selected, Rejected, or On Hold.

### 8. Full-Cycle Onboarding Stepper
*   **Onboarding Progress:** Track checklists with dynamic progress bars and percentages.
*   **Document Verification:** Lock/unlock validation indicators for tax forms, IDs, and contracts.
*   **Automatic Hiring:** Finalizing the checklist automatically transitions the candidate status to **Hired** and logs them as a permanent hire.

---

## 🛠️ Recruitment Workflows & Step-by-Step Operations

### Workflow A: Resume Sourcing & Processing
1. Navigate to the **Candidates** section and click `📄 Upload Resumes`.
2. Choose the target Job Position from the selector.
3. Drop multiple PDF or TXT resumes into the upload zone.
4. The system parses text, extracts contact details, evaluates ATS scoring, and displays cards in the **Applied** column.

### Workflow B: Assessment & AI Multi-Agent Analysis
1. The candidate applies through the Job Portal, submits their resume, and completes the personality assessment.
2. The AI assistant immediately calculates the scores.
3. Click on a Candidate Card to view the **Scorecard**.
4. Click `🤖 Run AI Analysis` to prompt Groq to run the behavioral-technical narrative verdict, generating tailored questions and a fit description.

### Workflow C: Drag-and-Drop Lifecycle Management
1. Switch to the **Pipeline View** inside the Candidates section.
2. Drag a candidate card from **Applied** to **Screening** as you review their profile.
3. Drag the card to **Interview** to open the Scheduling Modal. Fill in details (Interviewer, Format, Date/Time) and click Schedule.
4. An invite email is sent automatically via EmailJS. The card moves out of Candidates list to the **Interviews** page list.

### Workflow D: Interview Outcome & Selection
1. Navigate to the **Interviews** section.
2. View upcoming schedules on the side panel or calendar. Click `AI Questions` to prepare.
3. Once the interview is complete, click the **Outcome** button on the interview item.
4. Select **Select** (Approve for Hiring), **Reject**, or **On Hold** from the modal, input evaluation notes, and click **Log Outcome**.
5. Approved candidates automatically transition to the onboarding workflow.

### Workflow E: Onboarding & Hiring
1. Navigate to the **Onboarding** section.
2. Expand the candidate's checklist accordion.
3. Toggle document checkmarks and checklist items as the employee fulfills their steps.
4. When all tasks are checked, click `Complete Onboarding` to officially mark them as **Hired**.

---

## ⚙️ Tech Stack & Integration Specs
*   **LLM engine:** Groq Llama-3.3-70b-versatile
*   **Database:** Firebase FirestoreCompat (with automatic offline LocalStorage synchronization)
*   **Security:** Firebase Auth (Email/Password & Google Sign In)
*   **Mail Routing:** EmailJS Browser SDK (Direct routing templates for applications & interview invitations)
*   **UI Foundation:** HTML5 / Vanilla CSS3 (Custom Glassmorphic theme)
*   **Development Server:** Firebase Hosting
