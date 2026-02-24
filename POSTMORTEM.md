# POSTMORTEM.md — Technical Challenges & Lessons Learned

> A candid reflection on what was hard, what broke, and what I'd do differently.

---

## Challenge 1: Prisma Relation Naming Collisions

### What happened
The `Booking` model has two relations to `User` — one as student, one as instructor. Prisma requires explicit `@relation` names when a model has multiple relations to the same target model. I initially forgot the named relations, which caused a Prisma schema validation error.

### How it was resolved
Added explicit `@relation("StudentBookings")` and `@relation("InstructorBookings")` annotations on both sides of both relations. The same pattern was applied to `Availability`.

### Lesson learned
**Always name relations explicitly when a model has >1 relation to the same target.** Prisma's error message is clear, but it's easy to miss during initial schema design.

---

## Challenge 2: Conflict Detection Algorithm Edge Cases

### What happened
The first version of `detectBookingConflict` used a simpler query that failed on the "adjacent booking" edge case — a booking ending at 10:00 and a new booking starting at 10:00 was incorrectly flagged as a conflict.

### Root cause
The initial WHERE clause used `lte`/`gte` instead of strict `lt`/`gt`:
```typescript
// WRONG — flags adjacent bookings as conflicts
{ startTime: { lte: endTime }, endTime: { gte: startTime } }

// CORRECT — adjacent is fine, only true overlaps are blocked
{ startTime: { lt: endTime }, endTime: { gt: startTime } }
```

### How it was resolved
Updated the query to use strict operators. Added a dedicated unit test case for adjacent bookings that verifies `detectBookingConflict` returns `false`.

### Lesson learned
**Interval overlap logic is subtle.** Always test the boundary conditions: exact duplicate, partial overlap from left, partial overlap from right, containment (new inside existing, existing inside new), and adjacency. Write the unit tests before the implementation.

---

## Challenge 3: JWT TypeScript Typing

### What happened
`jwt.sign()` in newer versions of `@types/jsonwebtoken` has strict overloads that reject plain strings for `expiresIn`. The pattern `{ expiresIn: process.env.JWT_EXPIRES_IN }` fails TypeScript compilation because the environment variable is typed as `string | undefined`.

### How it was resolved
Cast the value explicitly:
```typescript
jwt.sign(payload, secret, {
  expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
});
```

### Lesson learned
**Environment variables are always `string | undefined` in TypeScript.** Parse and validate them at application startup (the `config/env.ts` pattern), then provide typed access throughout the codebase. Never spread env vars directly into typed function arguments.

---

## Challenge 4: Prisma JSON Field for Question Options

### What happened
The `Question.options` field is stored as `Json` in Prisma (which maps to `jsonb` in PostgreSQL). When reading it back, TypeScript types it as `Prisma.JsonValue` rather than `string[]`, causing frontend type errors when trying to `.map()` over it.

### How it was resolved
Used explicit casting on the frontend (`question.options as string[]`) and ensured the seed and create logic always passes a serialized JSON array. On the backend, returned options are always arrays because of how Prisma deserializes jsonb.

### Lesson learned
**Prisma's `Json` type requires careful handling at type boundaries.** For strongly typed arrays, consider storing as a typed Prisma model (`QuestionOption`) rather than `Json`, at the cost of an extra table join. For this scope, the cast was the right trade-off.

---

## Challenge 5: Docker Compose Ordering and Prisma Migrations

### What happened
The backend container started before the PostgreSQL container was ready to accept connections, causing `npx prisma migrate deploy` to fail with a connection refused error.

### How it was resolved
Added a `healthcheck` to the `postgres` service and a `depends_on: condition: service_healthy` directive to the `backend` service. This ensures Postgres is accepting connections before the backend runs migrations.

```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U airman"]
    interval: 10s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    postgres:
      condition: service_healthy
```

### Lesson learned
**`depends_on` without `condition: service_healthy` is effectively useless.** Docker starts the container, not the service inside it. Always use health checks for database dependencies.

---

## Challenge 6: React Query Cache Invalidation After Booking Status Update

### What happened
After an instructor approved or cancelled a booking, the booking list didn't refresh. The calendar also showed stale data.

### Root cause
The `onSuccess` callback only invalidated `["bookings"]` but not `["calendar"]`. Two separate query keys needed invalidation.

### How it was resolved
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["bookings"] });
  queryClient.invalidateQueries({ queryKey: ["calendar"] });
}
```

### Lesson learned
**Track all derived state carefully.** When a mutation affects multiple views, enumerate all affected query keys. A UI that shows the same data in two places (list + calendar) needs both invalidated.

---

## What I'd Do Differently

1. **Schema-first**: Lock the Prisma schema completely before writing any service code. Schema changes cascade.
2. **Contract testing**: Define the API contract (request/response shapes) as TypeScript types shared between frontend and backend before implementation.
3. **Test-driven conflict detection**: Write the conflict detection tests before the implementation. The boundary cases would have been caught immediately.
4. **Docker from day 1**: Run in Docker from the first commit to avoid "works on my machine" issues with database connections.
5. **shadcn/ui CLI**: In a real project, use `npx shadcn-ui@latest init` and `add` commands rather than manually writing component files to avoid drift from the upstream design system.
