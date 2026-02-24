# AIRMAN Core — 72-Hour Engineering Plan

> Structured breakdown of scope, prioritization, and delivery timeline.

---

## Phase Breakdown

### Hour 0–8: Foundation & Infrastructure
**Goal**: Running skeleton with auth end-to-end

- [ ] Initialize monorepo structure (`backend/`, `frontend/`)
- [ ] Backend: Express + TypeScript project setup
- [ ] Prisma schema design (all models + enums)
- [ ] Docker Compose with health checks
- [ ] Auth: register, login, JWT, bcrypt
- [ ] RBAC middleware (`authenticate`, `authorize` guards)
- [ ] Frontend: Vite + Tailwind + shadcn/ui bootstrap
- [ ] Login & Register pages

**Checkpoint**: Login works, JWT is returned, RBAC blocks unauthorized routes.

---

### Hour 8–20: Maverick Module (Learning Core)
**Goal**: Full course → module → lesson hierarchy with quiz engine

- [ ] Prisma models: `Course`, `Module`, `Lesson`, `Question`, `QuizAttempt`, `AttemptAnswer`
- [ ] Backend service layer: `course.service.ts`, `quiz.service.ts`
- [ ] REST API:
  - GET/POST `/courses` (pagination + title search)
  - GET/POST `/courses/:id/modules`
  - GET/POST `/modules/:id/lessons`
  - GET `/lessons/:id`
  - POST `/lessons/:id/attempt`
  - GET `/quiz/attempts`
- [ ] Quiz grading logic: score %, pass/fail at 70%, incorrect question identification
- [ ] Frontend: Courses list page with search + pagination
- [ ] Frontend: Course detail page (module/lesson hierarchy)
- [ ] Frontend: Lesson viewer (TEXT and MCQ_QUIZ modes)
- [ ] Frontend: Quiz interaction — select answers, submit, see results + explanations

**Checkpoint**: Student can browse courses, read text lessons, take quizzes and see their incorrect answers.

---

### Hour 20–36: Skynet Module (Scheduling + Conflict Detection)
**Goal**: Booking system with hard conflict detection

- [ ] Prisma models: `Availability`, `Booking` (with `BookingStatus` enum)
- [ ] Backend service: `scheduling.service.ts`
  - `createAvailability` (with slot overlap check)
  - `detectBookingConflict` (CORE algorithm)
  - `createBooking` (calls conflict check before insert)
  - `updateBookingStatus` (with conflict re-check on APPROVED)
  - `getWeeklyCalendar`
- [ ] REST API:
  - GET/POST/DELETE `/scheduling/availability`
  - GET/POST `/scheduling/bookings`
  - PATCH `/scheduling/bookings/:id/status`
  - GET `/scheduling/calendar`
- [ ] Frontend: SchedulingPage with weekly calendar grid
- [ ] Frontend: Availability creation form (INSTRUCTOR)
- [ ] Frontend: Booking request form (STUDENT)
- [ ] Frontend: Approve/Decline/Complete booking (INSTRUCTOR)
- [ ] Frontend: Cancel booking (STUDENT)

**Checkpoint**: Double-booking is impossible. Calendar shows color-coded events.

---

### Hour 36–48: Admin Module + Seeding
**Goal**: Admin panel fully functional

- [ ] Backend service: `admin.service.ts`
  - `listUsers` (paginated, role-filtered)
  - `createInstructor` (pre-approved)
  - `approveStudent`
  - `deleteUser`
- [ ] Frontend: AdminPage with user table, approve/delete actions
- [ ] Frontend: Create instructor form (inline)
- [ ] Database seed: Admin, Instructor, Student + sample course + availability

**Checkpoint**: Admin can manage all users without database access.

---

### Hour 48–60: Testing
**Goal**: Unit and integration test coverage

- [ ] Unit test: `auth.service.test.ts`
  - Email uniqueness check
  - Password hashing verification
  - Student `approved: false` on registration
  - JWT payload validation on login
  - Rejection on wrong password / unapproved account
- [ ] Unit test: `conflict-detection.test.ts`
  - No conflict (returns false)
  - Exact overlap (returns true)
  - Partial overlap start/end
  - Complete containment
  - Adjacent bookings (no conflict)
  - WHERE clause validation
  - Status filter (only REQUESTED+APPROVED)
  - excludeBookingId passthrough
- [ ] Integration test: `auth.integration.test.ts`
  - Register → 201, verify role/approved
  - Duplicate email → 400
  - Login unapproved → 401
  - Approve + login → JWT
  - GET /me with JWT → profile
  - GET /me without JWT → 401
- [ ] Integration test: `scheduling.integration.test.ts`
  - Create availability (INSTRUCTOR)
  - Student cannot create availability (403)
  - Request booking (STUDENT)
  - Duplicate booking → 400 conflict
  - Overlapping booking → 400 conflict
  - Approve booking (INSTRUCTOR)
  - Cancel booking (STUDENT)
  - Post-cancel rebook → 201 success

**Checkpoint**: All tests green.

---

### Hour 60–68: CI + Docker + Polish
**Goal**: One-command deployment, CI passing

- [ ] GitHub Actions: `.github/workflows/ci.yml`
  - Backend job: lint + unit tests + integration tests + build
  - Frontend job: lint + build
  - Docker smoke test on `main`
- [ ] Verify `docker compose up --build` starts all 3 containers
- [ ] Verify seed runs on first boot
- [ ] Responsive design audit on mobile
- [ ] Error states and loading skeletons throughout frontend

---

### Hour 68–72: Documentation
**Goal**: Mandatory docs complete

- [ ] `README.md` — architecture diagram, quick start, API reference
- [ ] `PLAN.md` — this document
- [ ] `CUTS.md` — intentional trade-offs
- [ ] `POSTMORTEM.md` — challenges and lessons learned

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Prisma migration conflicts | Medium | Design schema fully before first migration |
| Docker networking issues | Low | Use service names (`postgres`, `backend`) as hostnames |
| Conflict detection edge cases | High | Test 8 scenarios including adjacent, contained, and partial overlaps |
| JWT expiry in tests | Low | Use short-lived tokens with explicit test secrets |
| Frontend build errors (strict TS) | Medium | Enable strict mode from day 0 |

---

## Scope Exclusions (Level 1)
The following were explicitly descoped to maintain quality within 72 hours:
- Email notifications
- File/attachment uploads
- Real-time WebSocket updates
- Rich text editor (WYSIWYG) for lessons
- Payment processing
- Student progress dashboard (metrics/charts)
