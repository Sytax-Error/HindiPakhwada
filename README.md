# हिंदी पखवाड़ा — Competition Portal

A full-stack web app for running an office "Hindi Pakhwada" competition event:
employees register, log in, enter competitions, and admins declare winners.
Winners can download a PDF certificate.

**Stack:** React (Vite) frontend · Node.js/Express backend · MongoDB · JWT auth · PDFKit certificates.

See `PROJECT_DOCUMENT.md` for the full requirements, architecture, database schema,
and API reference.

## 1. Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a strong JWT_SECRET
npm install
npm run seed:admin   # creates the first admin account from .env values
npm run dev           # starts on http://localhost:5000
```

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your backend runs on a different URL
npm install
npm run dev            # starts on http://localhost:5173
```

## 4. Using the app

1. Open `http://localhost:5173`.
2. Register a normal employee account (or log in with the seeded admin account).
3. As an employee: browse competitions on the home page and click "नामांकन करें" to enter.
4. As admin (`/admin`):
   - **प्रतियोगिताएँ प्रबंधित करें** — create/deactivate competitions.
   - **विजेता घोषित करें** — pick a competition, assign 1st/2nd/3rd/consolation to
     participants, save.
5. Employees go to **मेरी प्रविष्टियाँ** to see their result and download a PDF
   certificate once a position has been awarded.
6. **परिणाम** is a public results page anyone can browse per competition.

## 5. Project structure

```
hindi-pakhwada/
├── backend/
│   ├── config/db.js
│   ├── models/            User, Competition, Participation
│   ├── middleware/auth.js JWT protect + adminOnly
│   ├── routes/             auth, competitions, participations, admin, certificates
│   ├── utils/               PDF certificate generator, admin seed script
│   └── server.js
└── frontend/
    └── src/
        ├── pages/           Home, Login, Register, MyParticipations, Results,
        │                    AdminDashboard, AdminCompetitions, AdminDeclareWinners
        ├── components/      Navbar, PrivateRoute
        ├── context/         AuthContext (JWT session)
        └── services/api.js  axios instance
```

## 6. Notes on going to production

- Replace the JWT secret with a long random value and never commit `.env`.
- Put the backend behind HTTPS; set `CLIENT_URL` to your deployed frontend origin.
- Consider rate-limiting `/api/auth/login` and adding email verification.
- Certificates are generated on-the-fly and streamed — nothing is stored on disk,
  so no cleanup job is needed.
