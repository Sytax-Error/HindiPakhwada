# Project Document — हिंदी पखवाड़ा (Hindi Pakhwada) Competition Portal

## 1. Overview

An internal web application that digitizes the running of an office's annual
"Hindi Pakhwada" (Hindi Fortnight) competitions — replacing the paper-based /
ASP.NET nomination-form workflow shown in the reference screenshots with a
modern React + Node.js system.

**Primary user goals**

| Actor | Goal |
|---|---|
| Employee | Register an account, browse competitions, enroll, view results, download certificate if awarded |
| Admin (Rajbhasha Committee) | Create/manage competitions, view participants, declare 1st/2nd/3rd/consolation winners, results auto-published |

## 2. Scope

**In scope**
- Employee self-registration & login (JWT-based auth)
- Competition catalog (name, date, time, duration, registration deadline)
- Employee self-enrollment into competitions before the deadline
- Admin competition management (create / deactivate)
- Admin winner declaration per competition (four award tiers)
- Public results page per competition
- PDF certificate generation & download, gated on having won a position

**Out of scope (future work)**
- Online submission of essay/audio/video answers inside the app
- Video-conferencing integration for live rounds (assumed handled outside the app, as in the original NICSI workflow)
- Email/SMS notifications
- Multi-event (multi-year) history browsing — current schema supports it structurally but no dedicated UI is built yet

## 3. User Roles & Permissions

| Capability | Employee | Admin |
|---|---|---|
| Register / Login | ✅ | ✅ (seeded) |
| View competitions & results | ✅ | ✅ |
| Enroll in a competition | ✅ | ➖ |
| View own participation history | ✅ | ✅ (all users, via participants list) |
| Create / deactivate competitions | ❌ | ✅ |
| Declare winners | ❌ | ✅ |
| Download own certificate (if awarded) | ✅ | ✅ (any participant's) |

## 4. System Architecture

```
┌────────────┐      HTTPS/JSON       ┌───────────────┐      Mongoose        ┌───────────┐
│  React SPA │  ───────────────────▶ │  Express API  │  ──────────────────▶ │ MongoDB   │
│  (Vite)    │  ◀─────────────────── │  (Node.js)    │  ◀────────────────── │           │
└────────────┘      JWT in header    └───────────────┘                     └───────────┘
                                              │
                                              ▼
                                     PDFKit certificate
                                     streamed on request
```

- **Frontend:** React 18 (Vite), React Router for navigation, Context API for
  auth session, Axios for API calls. Plain CSS, no external UI framework
  dependency, so it stays lightweight and easy to theme.
- **Backend:** Express REST API. Stateless — auth is a signed JWT the client
  stores in `localStorage` and sends as `Authorization: Bearer <token>`.
- **Database:** MongoDB via Mongoose ODM. Three collections: `users`,
  `competitions`, `participations`.
- **Certificates:** Generated on-demand server-side with PDFKit and streamed
  directly in the HTTP response — no files persisted on disk.

## 5. Data Model

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| employeeCode | String | required, unique |
| designation | String | |
| office | String | default "Delhi" |
| email | String | required, unique |
| mobile | String | |
| password | String (hashed, bcrypt) | required, never returned by API |
| role | "user" \| "admin" | default "user" |

### Competition
| Field | Type | Notes |
|---|---|---|
| name | String | e.g. "हिंदी निबन्ध लेखन प्रतियोगिता" |
| description | String | |
| date | Date | competition date |
| time | String | display string, e.g. "2:30 PM" |
| duration | String | e.g. "1 घंटा" |
| minParticipants | Number | default 9 — informational threshold |
| registrationDeadline | Date | enrollment closes after this |
| resultsDeclared | Boolean | set true once admin saves winners |
| isActive | Boolean | soft-delete flag |

### Participation
| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | |
| competition | ObjectId → Competition | |
| registeredAt | Date | |
| position | "first" \| "second" \| "third" \| "consolation" \| null | set by admin |
| remarks | String | optional admin note |
| certificateIssued | Boolean | set true on first certificate download |

`(user, competition)` has a unique compound index — one entry per employee per competition.

## 6. API Reference

Base URL: `/api`

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account, returns JWT |
| POST | `/auth/login` | — | Returns JWT |
| GET | `/auth/me` | Bearer | Current user profile |

### Competitions
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/competitions` | — | List active competitions |
| GET | `/competitions/:id` | — | Competition detail + participant count |
| POST | `/competitions` | Admin | Create competition |
| PUT | `/competitions/:id` | Admin | Update competition |
| DELETE | `/competitions/:id` | Admin | Soft-deactivate |

### Participations
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/participations` | Bearer | Enroll `{ competitionId }` |
| GET | `/participations/mine` | Bearer | Logged-in user's entries + results |
| GET | `/participations/competition/:id` | Bearer | Admin: all entrants; user: only their own |

### Admin
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Dashboard counters |
| POST | `/admin/declare-winners` | Admin | `{ competitionId, results: [{participationId, position, remarks}] }` |

### Certificates
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/certificates/:participationId` | Bearer (owner or admin) | Streams a PDF certificate; 400 if no award yet |

## 7. Key Flows

**Enrollment:** Employee logs in → Home page lists competitions → clicks
"नामांकन करें" (Register) → `POST /participations` → button becomes "पंजीकृत ✓".
Enrollment is blocked once `registrationDeadline` passes.

**Winner declaration:** Admin opens **विजेता घोषित करें** → selects a
competition → sees every enrolled participant → assigns a position from a
dropdown per row → **परिणाम सुरक्षित करें** → `POST /admin/declare-winners`
bulk-updates all `Participation` records and flips `resultsDeclared` on the
`Competition`.

**Certificate download:** From **मेरी प्रविष्टियाँ**, a winner clicks
"डाउनलोड करें" → backend verifies ownership (or admin) and that `position`
is set → streams a landscape A4 PDF certificate with the employee's name,
designation, competition name, date, and award tier.

## 8. Security Notes

- Passwords hashed with bcrypt (10 rounds), never returned in API responses.
- JWT signed with a server-side secret; expires per `JWT_EXPIRES_IN` (default 7 days).
- All admin routes require both a valid token and `role === "admin"`.
- Certificate route checks that the requester is the participation's owner or an admin before streaming.
- Input validation via `express-validator` on register/login/competition-create.

## 9. Deployment Checklist

1. Provision MongoDB (Atlas recommended for zero-ops).
2. Set strong `JWT_SECRET`, correct `MONGO_URI`, `CLIENT_URL` in backend `.env`.
3. `npm run seed:admin` once to create the first admin.
4. Deploy backend (e.g. Render/Railway/EC2) and frontend (e.g. Vercel/Netlify),
   pointing `VITE_API_URL` at the deployed backend.
5. Enforce HTTPS end-to-end.

## 10. Possible Enhancements

- Add essay/answer file upload per competition (matches the original site's
  "scan and upload within 20 minutes" step).
- Wire video-conferencing links into the competition record for live rounds.
- Add a "Certificate downloaded" audit trail visible to admins.
- Add email notifications on registration and result declaration.
