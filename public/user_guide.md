# 📘 HR Copilot — Admin & Developer Guide

This guide contains everything you need to manage, edit, and redeploy your HR Copilot platform in the future without any AI assistance.

---

## 🛠️ How to Manage the App

### 1. Project Structure
- **`index.html`**: The structure and navigation of the app.
- **`styles.css`**: The design system (colors, buttons, layout).
- **`app.js`**: Core controllers (handling button clicks, navigation, routing).
- **`data.js`**: **The Brain.** Contains your Firebase Config and the Assessment Question Bank.
- **`pages.js`**: UI code for each tab (Dashboard, Jobs, Candidates, etc.).
- **`quiz.js`**: The quiz engine and timing logic.
- **`groq.js`**: The AI prompts that talk to Groq.

### 2. Updating Assessment Questions
If you want to change the personality test questions:
1. Open `data.js`.
2. Find the `QUIZ_QUESTIONS` array.
3. You can add or edit questions here. Follow the format: `{d:'dimension', q:'Question?', o:[{t:'Option', s:Score}]}`.

### 3. Changing AI Behavior
If the AI is too nice or too mean:
1. Open `groq.js`.
2. Find the `scoreCandidate` or `analyzeWithPersonality` prompts.
3. Edit the text inside the backticks (`` ` ``) to give the AI new instructions.

---

### 3. User Authentication
The platform uses **Firebase Authentication**. 
- To manage users, go to the **Authentication** tab in the Firebase Console.
- You can enable/disable **Email/Password** or **Google** providers in the **Sign-in method** tab.
- New users can sign up directly from the login page.
- **🚀 Demo Mode:** There is a "Try Demo" button on the login screen. Clicking this will instantly populate your workspace with 2 sample jobs and test data so you can explore the features without manual entry.

### 4. Multi-Account Usage
If you manage multiple HR accounts (e.g., using different Google accounts for different branches or clients):
- **Data Isolation:** The app automatically separates data based on your logged-in Google ID. Switching accounts will instantly refresh the dashboard with that specific account's jobs and candidates.
- **Safe Logout:** Always use the "Logout" button in the sidebar to ensure your current session is cleared before another user signs in on the same browser.
- **Offline Access:** Your data is cached locally for your specific ID. This means if you lose internet connection, you can still view your own data, but you won't see other users' data on the same device.

---

## 📋 Managing Candidates

### 1. Resume Storage & Downloads
- We use **Firebase Storage** to store resumes. This ensures that even large PDF files (with images/graphics) are saved securely and can be retrieved instantly.
- You can download the original PDF by clicking the **"📥 Download PDF"** button in the candidate scorecard.

### 2. Assessment Reports
- Detailed reports for the personality test are available in the scorecard.
- Expand the **"⏱️ Detailed Assessment Report"** section to see:
  - Exact questions asked.
  - Scores given for each dimension.
  - Seconds spent on each question.

---

## 🚀 How to Re-Deploy (Push Changes Live)

Whenever you edit a file and want the live website (`.web.app`) to update:

1. Open your **Terminal** (VS Code Terminal or Windows Terminal).
2. Go to your project folder:
   ```bash
   cd "C:\Users\ATM\Desktop\HR Copilot"
   ```
3. Run the deploy command:
   ```bash
   npx firebase-tools deploy
   ```
4. Wait for it to say "Deploy complete!". Your live website is now updated.

---

## 🔑 Managing API Keys

### Groq AI
- To get a new key, go to [console.groq.com](https://console.groq.com).
- If you lose your key, you can reset it in the **Settings** tab inside the app.

### EmailJS
- To change the email content, go to [emailjs.com](https://emailjs.com).
- Ensure your template uses these variables: `{{to_name}}`, `{{to_email}}`, `{{job_title}}`, and `{{message}}`. 
- The `{{message}}` variable will automatically contain different text for application acknowledgements versus final assessment completions.

### Firebase
- Your database is at [console.firebase.google.com](https://console.firebase.google.com).
- If your 30-day "Test Mode" expires, go to the **Rules** tab in Firestore and update the date, or change the rules to `allow read, write: if true;`.

---

## 💡 Troubleshooting
- **"Invalid Document" Error:** This happens if you upload a non-resume PDF. The system is designed to reject random text for better accuracy.
- **Email not sending:** Check your EmailJS dashboard to ensure the `To Email` field is set to `{{to_email}}`.
- **Link not working on phone:** Ensure you are using the public `https://...web.app` link, not the `localhost` link.
