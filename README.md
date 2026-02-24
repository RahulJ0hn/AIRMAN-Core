# ✈️ AIRMAN Core — Flight School Management Platform

> Production-minded full-stack platform for aviation training management.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        Docker Compose Network                       │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐ │
│  │                 │    │                 │    │                │ │
│  │   Frontend      │    │   Backend       │    │  PostgreSQL    │ │
│  │  React + Vite   │───▶│  Express + TS   │───▶│  16-alpine     │ │
│  │  Tailwind CSS   │    │  Prisma ORM     │    │                │ │
│  │  shadcn/ui      │    │  JWT Auth       │    │  Port: 5432    │ │
│  │  Port: 5173/80  │    │  RBAC Guards    │    └────────────────┘ │
│  └─────────────────┘    │  Port: 4000     │                        │
│                         └─────────────────┘                        │
└────────────────────────────────────────────────────────────────────┘

Frontend (React)                Backend (Express)
├── Auth pages                  ├── /api/auth      (JWT, bcrypt)
├── Course browser              ├── /api/courses   (CRUD + pagination)
├── Lesson viewer               ├── /api/modules
├── Quiz engine                 ├── /api/lessons
├── Weekly calendar             ├── /api/quiz      (attempts, scoring)
└── Admin panel                 ├── /api/scheduling (conflict detection)
                                └── /api/admin     (RBAC: ADMIN only)
```

## Module Breakdown

### Maverick Module (Learning)
- **Hierarchy**: Course → Module → Lesson
- **Lesson Types**: `TEXT` (markdown content) and `MCQ_QUIZ`
- **Quiz Engine**: Stores attempts, grades answers, calculates scores (70% pass threshold), returns incorrect questions with explanations
- **Pagination**: All list endpoints paginated with `page`, `limit`, `search` params

### Skynet Module (Scheduling)
- **Instructor Availability**: Time slot management with overlap detection
- **Booking Requests**: Students request sessions; instructors approve/decline/complete
- **Conflict Detection**: Hard constraint — prevents double-booking an instructor across `REQUESTED` and `APPROVED` bookings using date-range overlap math
- **Booking Statuses**: `REQUESTED → APPROVED → COMPLETED | CANCELLED`
- **Calendar View**: Responsive weekly calendar (list + grid)

### Authentication & RBAC
| Role | Permissions |
|------|------------|
| `ADMIN` | All access + create instructors, approve students |
| `INSTRUCTOR` | Create/manage courses, set availability, manage bookings |
| `STUDENT` | View content, attempt quizzes, request bookings |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Zustand |
| Backend | Node.js 20, Express 4, TypeScript 5, Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken), bcrypt (12 rounds) |
| Infrastructure | Docker Compose |
| Testing | Jest, ts-jest, supertest |
| CI | GitHub Actions |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local dev)

### One-Command Start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/api
- **Health check**: http://localhost:4000/health

### Demo Credentials (seeded automatically)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@airman.dev | admin123! |
| Instructor | maverick@airman.dev | instructor123! |
| Student | rooster@airman.dev | student123! |

---

## Local Development

```bash
# 1. Start the database
docker compose up postgres -d

# 2. Backend
cd backend
npm install
cp .env.test .env  # or create your own .env
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## API Reference (Key Endpoints)

### Auth
```
POST   /api/auth/register     Register (student by default)
POST   /api/auth/login        Login → returns JWT
GET    /api/auth/me           Current user profile
```

### Maverick (Learning)
```
GET    /api/courses                        List courses (pagination + search)
POST   /api/courses                        Create course [INSTRUCTOR, ADMIN]
GET    /api/courses/:id                    Course detail with modules/lessons
POST   /api/courses/:courseId/modules      Add module [INSTRUCTOR, ADMIN]
GET    /api/modules/:moduleId/lessons      List lessons
POST   /api/modules/:moduleId/lessons      Create lesson [INSTRUCTOR, ADMIN]
GET    /api/lessons/:id                    Lesson detail
POST   /api/lessons/:lessonId/attempt      Submit quiz attempt [STUDENT]
GET    /api/quiz/attempts                  My quiz attempts [STUDENT]
```

### Skynet (Scheduling)
```
GET    /api/scheduling/availability        List all availability slots
POST   /api/scheduling/availability        Create slot [INSTRUCTOR]
DELETE /api/scheduling/availability/:id    Delete slot [INSTRUCTOR]
GET    /api/scheduling/bookings            My bookings (role-filtered)
POST   /api/scheduling/bookings            Request booking [STUDENT]
PATCH  /api/scheduling/bookings/:id/status Update booking status
GET    /api/scheduling/calendar            Weekly calendar view
```

### Admin
```
GET    /api/admin/users                    List all users [ADMIN]
POST   /api/admin/users/instructor         Create instructor [ADMIN]
PATCH  /api/admin/users/:id/approve        Approve student [ADMIN]
DELETE /api/admin/users/:id               Delete user [ADMIN]
```

---

## Testing

```bash
cd backend

# Unit tests (no DB required)
npm run test:unit

# Integration tests (requires PostgreSQL)
npm run test:integration

# All tests with coverage
npm run test:coverage
```

### Test Coverage
- **Unit**: `auth.service.test.ts` — registration, login, JWT validation, bcrypt verification
- **Unit**: `conflict-detection.test.ts` — 7 scenarios covering overlap algorithm edge cases
- **Integration**: `auth.integration.test.ts` — full auth flow against real DB
- **Integration**: `scheduling.integration.test.ts` — booking conflict detection with real DB

---

## Database Schema

```
User ──┬── Course (created)
       ├── QuizAttempt
       ├── Availability (instructor)
       ├── Booking (as student)
       └── Booking (as instructor)

Course ── Module ── Lesson ──┬── Question ── AttemptAnswer
                             └── QuizAttempt ── AttemptAnswer
```

---

## Project Structure

```
airman-core/
├── backend/
│   ├── src/
│   │   ├── config/         # Prisma client, env config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, RBAC, validation
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Response helpers, pagination
│   │   └── tests/          # Unit & integration tests
│   └── prisma/
│       ├── schema.prisma   # Full data model
│       └── seed.ts         # Demo data seeder
├── frontend/
│   └── src/
│       ├── components/     # UI components (shadcn/ui)
│       ├── hooks/          # useAuth, useToast
│       ├── pages/          # Route-level page components
│       ├── services/       # API service layer
│       └── types/          # Shared TypeScript types
├── .github/workflows/      # GitHub Actions CI
├── docker-compose.yml
├── README.md
├── PLAN.md
├── CUTS.md
└── POSTMORTEM.md
```
