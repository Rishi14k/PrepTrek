# PrepTrack - Entrance Examination Performance Analytics Platform

> A full-stack **MERN** web platform designed for competitive entrance examination aspirants (CAT, GATE, JEE, NEET, UPSC, NIMCET). Record mock test results, detect weak and declining chapters, track study time with a server-persisted Pomodoro timer, receive personalized study recommendations, and compete on an opt-in leaderboard.

---

## 🚀 Key Features

1. **Intelligent Mock Test Analytics & Validation**
   - **Mode A (Single Chapter Tests)** and **Mode B (Sectional / Full Mock Papers)** with multiple breakdown entries.
   - Enforces mathematical invariants:
     - $\text{Attempted} = \text{Correct} + \text{Incorrect}$
     - $\text{Total} = \text{Attempted} + \text{Unattempted}$
     - $\text{Correct} \le \text{Attempted}$
     - $\text{Marks Obtained} \le \text{Maximum Marks}$
   - Real-time client-side calculation preview and strict server-side validation.
   - **CSV Import Engine**: Upload results in bulk with live row-by-row error detection, alongside downloadable CSV templates.

2. **Rigorous Calculation & Analytics Engine**
   - **Marks-Weighted Score %**: $\frac{\sum \text{Marks Obtained}}{\sum \text{Max Possible Marks}} \times 100$
   - **Overall Accuracy**: $\frac{\sum \text{Correct Answers}}{\sum \text{Attempted Questions}} \times 100$ (never averages percentages).
   - **Zero-attempt safeguards**: Cleanly returns `null` / `N/A` avoiding division by zero.
   - **Comparative Period Delta**: Tracks percentage point changes vs preceding equivalent periods ($7d, 30d, 90d$).

3. **Chapter-Wise Strength & Weakness Classifier**
   - Categorizes syllabus topics into **Strong** ($\ge 80\%$), **Developing** ($60\% - 79.9\%$), and **Needs Improvement** ($< 60\%$).
   - **Evidence Requirement Rules**: Requires minimum tests ($\ge 2$) and questions ($\ge 20$) before labeling to avoid premature misclassifications.
   - Identifies **Declining Trajectories** (when recent test scores drop $\ge 8\%$ vs earlier baselines) and **Neglected Chapters** ($> 14$ days without practice).

4. **Rule-Based Recommendation Engine**
   - Heuristics for: Low Accuracy, Speed Bottlenecks (High accuracy with low attempt rate), Careless Error / Negative Marking Risks, Inconsistent Routines, and Diagnostic Test prompts.
   - **1-Click Conversion**: Convert recommendations into actionable revision tasks directly in your Study Planner.

5. **Authoritative Server-Persisted Study Timer**
   - Standard stopwatch and **Pomodoro focus mode** ($25\text{m}$ focus / $5\text{m}$ break).
   - Survives browser refreshes and connection interruptions without losing time.
   - Prevents duplicate concurrent timers per student.
   - Authoritative elapsed calculation derived from server timestamps.
   - Visual daily study goal completion progress and active daily streak tracking.

6. **Privacy-Preserving Community Leaderboard**
   - 100% voluntary **opt-in**.
   - Custom public display name; private email addresses and personal notes are never exposed.
   - Competitive ranking categories: Weekly Study Time, Monthly Study Time, Weekly Score %, Monthly Score %, Consistency, and Improvement.

7. **Role-Protected Administration Center**
   - Global usage analytics: registered users, active students, tests logged, total study hours.
   - Dynamic syllabus management: Create and reorder subjects and chapters.
   - Configurable classification thresholds and evidence requirements.
   - Student account moderation (activate/deactivate).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, Recharts, Lucide React, React Hook Form, Zod, Axios, React Hot Toast |
| **Backend** | Node.js, Express.js, MongoDB / Mongoose, JWT (HTTP-only cookies), bcryptjs, Helmet, Morgan, Express Rate Limit, Zod |
| **Testing** | Jest, Supertest, MongoMemoryServer |

---

## 📦 Project Structure

```
preptrack/
├── client/
│   ├── src/
│   │   ├── api/client.js               # Axios instance with credentials
│   │   ├── components/
│   │   │   ├── common/                 # StatCard, ChartCard, DateRangeFilter, Badge, Feedback
│   │   │   └── layout/                 # AppHeader, AppSidebar (collapsible)
│   │   ├── context/AuthContext.jsx     # User session & Dark mode state
│   │   ├── layouts/                    # AppLayout, AuthLayout
│   │   ├── pages/                      # Dashboard, Tests, AddTest, Analytics, ChapterDetail,
│   │   │                               # StudyTimer, StudyHistory, StudyPlanner, Reports,
│   │   │                               # Leaderboard, Settings, AdminDashboard, Auth pages
│   │   ├── routes/AppRoutes.jsx        # ProtectedRoute and AdminRoute guards
│   │   ├── App.jsx
│   │   └── index.css                   # Custom scrollbars, glassmorphism, theme
│   ├── vite.config.js                  # Proxy configuration to port 5000
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/                     # Database connector with MongoMemoryServer fallback, env
│   │   ├── controllers/                # Auth, User, Subject, Test, Analytics, Timer, Planner, Admin
│   │   ├── middleware/                 # authenticate, requireRole, validate (Zod)
│   │   ├── models/                     # User, Subject, Chapter, Test, TestBreakdown, StudySession, StudyTask, SystemSetting
│   │   ├── routes/                     # REST API endpoints
│   │   ├── services/                   # Analytics calculation engine, Recommendation engine
│   │   ├── tests/                      # Jest unit & integration test suites
│   │   ├── validators/                 # Zod validation schemas
│   │   ├── app.js
│   │   └── server.js                   # Graceful shutdown & automatic auto-seed
│   ├── scripts/                        # seedSubjects.js, seedAdmin.js, seedDemoData.js
│   └── package.json
│
├── .env.example
├── package.json                        # Root concurrent runners
└── README.md
```

---

## ⚡ Installation & Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v22.11)
- **npm** v9+
- *(Optional)* A running local MongoDB instance on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI. **If no MongoDB is running, PrepTrack automatically boots an embedded MongoDB memory engine so the app runs out-of-the-box with zero setup!**

### 2. Install Dependencies
```bash
# In project root
npm run install:all
```
Or separately:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Environment Variables
Create `.env` in `server/` (or copy `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/preptrack
JWT_SECRET=preptrack_jwt_super_secret_key_2026_entrance_exam
JWT_EXPIRES_IN=1h
REFRESH_SECRET=preptrack_refresh_super_secret_key_2026_long_term
REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

ADMIN_SEED_EMAIL=your_admin_email@example.com
ADMIN_SEED_PASSWORD=your_secure_admin_password
```

### 4. Seed Subjects
```bash
cd server
npm run seed
```
This populates:
- **4 Subjects**: Quantitative Aptitude, Logical Reasoning, English Language, Computer Science.
- **39 Chapters**: Percentage, Profit & Loss, Seating Arrangement, Syllogisms, Reading Comprehension, DBMS, etc.

### 5. Start the Application
You can launch both server and client concurrently from the root directory:
```bash
npm run dev
```
- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Testing

Run the comprehensive unit and integration test suite:
```bash
cd server
npm test
```
The test suite covers:
- Score percentage, accuracy, and attempt rate arithmetic.
- Marks-weighted overall scores vs simple averages.
- Zero-attempt division by zero protections.
- Threshold classifications & evidence requirements.
- Heuristic recommendation engine rules.
- JWT authentication & cookie verification.
- Mathematical invariant request rejection.
- Timer start/pause/resume and duplicate active session prevention.
- Role-based route authorization.

---

## 🛡️ Security Features
- **HTTP-Only Cookies**: Authentication tokens are never exposed to `localStorage` or JavaScript.
- **Rate Limiting**: Configured for authentication and password recovery endpoints.
- **Strict Role-Based Authorization**: Administrative APIs strictly check `req.user.role === 'admin'`.
- **Ownership Verification**: Students can only access, edit, or delete their own records.
- **Mathematical Invariant Enforcement**: Both client and server reject corrupt test data.
