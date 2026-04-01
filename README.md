<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=2800&pause=2000&color=22C55E&center=true&vCenter=true&width=700&lines=GutSense+AI+%F0%9F%8C%BF;Your+Gut+Health%2C+Tracked+by+AI" alt="GutSense AI" />

<br/>

**A production-grade full-stack MERN application that uses Google Gemini AI to track your digestive health through natural conversation and food photo analysis.**

<br/>

[![CI Tests](https://img.shields.io/badge/Tests-46%20passing-22c55e?style=for-the-badge&logo=jest&logoColor=white)](./backend/__tests__)
[![Node](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Gemini](https://img.shields.io/badge/Gemini-1.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](./LICENSE)

<br/>

[**Live Demo**](https://gutsense.onrender.com) · [**API Docs**](#-api-reference) · [**Quick Start**](#-quick-start) · [**Architecture**](#-architecture)

</div>

---

## 🧠 What makes this different

Most food trackers make you search a database and manually fill in calories. GutSense works differently — you just **talk to it**.

```
You:  "just had biryani with raita and a cold drink"
AI:   Logged ✓  Biryani (lunch) · Raita · Cold drink
      ⚠️  Cold drinks can slow digestion. Raita was a great
      choice — probiotics help offset heavy meals. Gut score: 68/100
```

The AI reads your message, extracts every food item, estimates calories, assigns a gut health score, and writes it to MongoDB — **all in one message, zero manual input.**

---

## ✨ Feature Overview

| Feature | What it does |
|---|---|
| 🤖 **AI Chat** | Gemini 1.5 Flash parses natural language and auto-logs meals |
| 📷 **Image Recognition** | Photograph food → Gemini Vision identifies it → auto-logged |
| 📊 **Analytics Dashboard** | 7/14/30-day gut score trends, meal charts, top foods — Recharts |
| ⚠️ **Trigger Food Alerts** | AI warns in real-time when you log a food from your avoid list |
| 🎯 **Daily Goals** | Water, meals, calories, fiber — with live progress bars |
| 🔥 **Streak System** | Daily logging streak tracked per user in MongoDB |
| 📄 **PDF Export** | One-click weekly health report with full meal history |
| 🌙 **Dark Mode** | Persisted to localStorage, toggle in sidebar |
| 📱 **PWA Ready** | Installable on mobile via web app manifest |
| 🔐 **Secure Auth** | JWT in httpOnly cookies, bcrypt, rate limiting, NoSQL injection protection |
| 🧪 **46 Tests** | Jest + Supertest across auth, meals, goals, water, security |
| 🚀 **CI/CD** | GitHub Actions runs full test suite on every push |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React 18)                     │
│                                                             │
│   AuthContext ──► useChat hook ──► Axios (api.js)           │
│        │               │                  │                 │
│   Protected       Optimistic UI      Bearer token +         │
│    Routes          + streaming       httpOnly cookie         │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                    EXPRESS API (Node.js)                      │
│                                                             │
│  helmet ──► mongoSanitize ──► rateLimiter ──► JWT guard     │
│                                                             │
│  /api/auth    /api/meals    /api/goals    /api/analytics    │
│  /api/chat    /api/water    /api/report                     │
│                    │                                        │
│            Gemini 1.5 Flash API                             │
│         (chat + Vision image analysis)                      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                       MONGODB ATLAS                          │
│                                                             │
│   users    meals    goals    water    chats                 │
│              │                                              │
│        Compound index                                       │
│        { user, eatenAt }  ◄── sub-100ms aggregations       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Implementation

This isn't a tutorial project with `localStorage` tokens. Here's what's actually implemented:

```js
// JWT stored in httpOnly cookie — JS cannot read it (XSS protection)
res.cookie("gut_token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
  sameSite: "strict",                              // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,               // 7 days
});
```

```js
// Rate limiting — brute force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // 10 attempts max
  message: { message: "Too many login attempts." }
});
```

```js
// NoSQL injection blocked
app.use(mongoSanitize());
// Strips { email: { $gt: "" } } attacks from all request bodies
```

| Layer | Tool | What it blocks |
|---|---|---|
| Headers | `helmet` | Clickjacking, MIME sniffing, XSS |
| Rate limit | `express-rate-limit` | Brute force, API abuse |
| Injection | `express-mongo-sanitize` | NoSQL operator injection |
| Auth | `httpOnly cookie + JWT` | XSS token theft |
| Passwords | `bcryptjs` (12 rounds) | Rainbow table attacks |

---

## 📊 API Reference

All protected routes require `Authorization: Bearer <token>` header or the `gut_token` httpOnly cookie.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user, sets httpOnly cookie |
| `POST` | `/api/auth/login` | ❌ | Login, sets httpOnly cookie |
| `POST` | `/api/auth/logout` | ❌ | Clears cookie |
| `GET` | `/api/auth/me` | ✅ | Get current user |

### Meals
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/meals` | ✅ | Today's meals |
| `GET` | `/api/meals/history?days=7` | ✅ | Historical meals |
| `POST` | `/api/meals` | ✅ | Manual meal log |
| `DELETE` | `/api/meals/:id` | ✅ | Delete a meal |

### Chat & AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat/send` | ✅ | Send message or image to Gemini |
| `GET` | `/api/chat/history` | ✅ | Chat history |
| `DELETE` | `/api/chat/clear` | ✅ | Clear chat |

### Analytics & Goals
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard?days=7` | ✅ | Charts data (aggregation pipeline) |
| `GET` | `/api/analytics/weekly-report` | ✅ | Weekly summary |
| `GET` | `/api/goals` | ✅ | Get user goals |
| `PUT` | `/api/goals` | ✅ | Update goals |
| `GET` | `/api/water/today` | ✅ | Today's water intake |
| `POST` | `/api/water/add` | ✅ | Log a glass of water |
| `GET` | `/api/report/export` | ✅ | Weekly PDF report data |

---

## 🧪 Testing

**46 tests** across 5 suites covering the full API surface.

```bash
cd backend && npm test
```

```
 PASS  __tests__/auth.test.js
  POST /api/auth/register
    ✓ registers a new user and returns token + user object
    ✓ sets an httpOnly cookie on register
    ✓ rejects registration when email already exists
    ✓ rejects registration with missing fields
    ✓ rejects registration with password shorter than 6 characters
    ✓ stores email in lowercase regardless of input casing
    ✓ does not store plain-text password in database

 PASS  __tests__/meals.test.js
    ✓ logs a meal and returns it with a gut score
    ✓ gives healthy foods a higher gut score than junk food
    ✓ flags a trigger food when it matches user avoid list
    ✓ only returns meals belonging to the requesting user
    ✓ returns 404 when deleting another user's meal

 PASS  __tests__/security.test.js
    ✓ blocks NoSQL injection in login email field
    ✓ blocks NoSQL injection in register email field
    ✓ GET /api/meals returns 401 without token
    ✓ GET /api/analytics/dashboard returns 401 without token
    ✓ includes security headers from helmet
    ✓ rejects a tampered JWT token

 PASS  __tests__/goals.test.js
 PASS  __tests__/water.test.js

Test Suites: 5 passed, 5 total
Tests:       46 passed, 46 total
```

---

## ⚡ Quick Start

**Prerequisites:** Node.js 18+, MongoDB running locally (or Atlas URI)

```bash
# 1. Clone
git clone https://github.com/yourusername/gutsense-ai.git
cd gutsense-ai

# 2. Backend
cd backend
npm install
cp .env.example .env
# → Edit .env: add MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
# ✅ Server → http://localhost:5001
# ✅ Health  → http://localhost:5001/api/health

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
# ✅ App → http://localhost:5173

# 4. Tests
cd backend && npm test
```

**Get a Gemini API key (free):** https://aistudio.google.com/app/apikey

---

## 🌍 Deploy to Production

This project ships with a `render.yaml` for one-command deployment.

```bash
# 1. Push to GitHub
# 2. Go to render.com → New → Blueprint
# 3. Connect your repo — Render reads render.yaml automatically
# 4. Set env vars in Render dashboard:
#    MONGO_URI, JWT_SECRET, GEMINI_API_KEY
```

Backend deploys as a Node.js web service. Frontend deploys as a static site with SPA rewrite rules. Both services are defined in `render.yaml`.

---

## 📁 Project Structure

```
gutsense-ai/
│
├── .github/
│   └── workflows/ci.yml          # GitHub Actions — runs tests on every push
│
├── render.yaml                   # One-click Render.com deployment
│
├── backend/
│   ├── __tests__/
│   │   ├── auth.test.js          # 12 tests — register, login, JWT, cookies
│   │   ├── meals.test.js         # 10 tests — CRUD, gut score, user isolation
│   │   ├── goals.test.js         #  6 tests — defaults, updates, injection guard
│   │   ├── water.test.js         #  5 tests — increment, decrement, floor
│   │   └── security.test.js      # 13 tests — NoSQL injection, 401s, headers
│   │
│   ├── middleware/
│   │   └── auth.js               # JWT guard (reads cookie OR Bearer header)
│   │
│   ├── models/
│   │   ├── User.js               # bcrypt pre-save hook, matchPassword method
│   │   ├── Meal.js               # compound index { user, eatenAt }
│   │   ├── Goal.js               # per-user goals, syncs to triggerFoods
│   │   ├── Water.js              # daily water log { user, date } unique index
│   │   └── Chat.js               # chat history with food entries embedded
│   │
│   ├── routes/
│   │   ├── auth.js               # register, login, logout, /me
│   │   ├── meals.js              # CRUD + gut score heuristic
│   │   ├── goals.js              # goals CRUD + avoidFoods → triggerFoods sync
│   │   ├── analytics.js          # MongoDB aggregation pipelines
│   │   ├── chat.js               # Gemini chat + Vision API integration
│   │   ├── water.js              # daily water intake tracker
│   │   └── report.js             # weekly PDF report data
│   │
│   └── server.js                 # helmet, rate limiters, mongo-sanitize, routes
│
└── frontend/
    └── src/
        ├── context/AuthContext.jsx   # global auth state + refreshUser
        ├── hooks/useChat.js          # chat state, meal sync, streak, manual log
        ├── utils/api.js              # axios instance with interceptors
        └── pages/
            ├── Chat.jsx              # AI chat + image upload + sidebar
            ├── Dashboard.jsx         # Recharts analytics + PDF export
            ├── Goals.jsx             # sliders, progress bars, avoid foods
            ├── Login.jsx
            └── Register.jsx
```

---

## 🛠 Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Recharts (line, bar, pie charts)
- React Router v6
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + `bcryptjs`
- `helmet` + `express-rate-limit` + `express-mongo-sanitize`
- `cookie-parser`

**AI**
- Google Gemini 1.5 Flash — conversational food parsing
- Google Gemini Vision API — food image recognition

**Testing & DevOps**
- Jest + Supertest
- GitHub Actions CI
- Render.com (`render.yaml`)
- PWA Web App Manifest

---

## 🧩 How the AI food logging works

```
User message: "had dal chawal for lunch and aam panna"
                            │
                    Sent to Gemini with:
                    - System prompt (gut health expert)
                    - User's recent meal history (context)
                    - Last 8 chat messages (context)
                            │
              Gemini replies with advice +
              structured FOOD_LOG at the end:
              FOOD_LOG: [
                { "food": "dal chawal", "mealType": "lunch", "calories": 380 },
                { "food": "aam panna",  "mealType": "snack", "calories": 80  }
              ]
                            │
              Backend strips FOOD_LOG from reply,
              parses it, checks against triggerFoods,
              calculates gut score, saves to MongoDB
                            │
              Frontend shows clean AI reply +
              refreshes meal sidebar automatically
```

---

## 📈 What I'd add next

- [ ] Push notifications when streak is about to break
- [ ] Food database integration (Open Food Facts API) for accurate calories
- [ ] Doctor/nutritionist report sharing via email
- [ ] React Native mobile app (Expo)
- [ ] Redis caching for analytics queries

---

<div align="center">

**Built with ❤️ and too much chai**

If this project helped you, consider giving it a ⭐

</div>
