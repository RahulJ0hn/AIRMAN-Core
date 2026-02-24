# CUTS.md — Intentional Trade-offs & Design Decisions

> Every engineering decision is a trade-off. This document is transparent about what was cut, why, and what the production path would look like.

---

## 1. No Refresh Tokens (JWT Only)

**What was cut**: OAuth2-style refresh token rotation (short-lived access tokens + long-lived refresh tokens in httpOnly cookies).

**What was implemented**: Single JWT with 7-day expiry, stored in `localStorage`.

**Why**: Implementing a full refresh token flow adds ~4 hours of complexity (token store, rotation endpoint, cookie management, CSRF protection). For a 72-hour assessment, the trade-off is clear.

**Production path**: Issue 15-min access tokens. Store refresh tokens in the database (with revocation support). Use `httpOnly, Secure, SameSite=Strict` cookies. Rotate refresh tokens on use.

---

## 2. No Email Verification or Password Reset

**What was cut**: Email confirmation on registration, forgot-password flow.

**Why**: Requires SMTP configuration, templating, and token storage. These add surface area without demonstrating core architectural competency.

**Production path**: Use a transactional email provider (Resend, SendGrid). Generate a signed, time-limited token; store a hash in the DB. Provide a `/auth/verify-email` and `/auth/reset-password` flow.

---

## 3. No Rich Text / Markdown Rendering on Frontend

**What was cut**: A full WYSIWYG or Markdown rendering library for `TEXT` lessons.

**What was implemented**: Plain pre-formatted text display. The backend stores markdown/plaintext in the `content` field.

**Why**: A Markdown editor (e.g., TipTap, react-markdown) adds dependencies and considerable UI complexity without changing the architectural patterns being assessed.

**Production path**: Add `react-markdown` with `remark-gfm` for rendering. Use a TipTap or ProseMirror editor for instructor content creation.

---

## 4. Soft Pagination Only (Cursor Pagination Skipped)

**What was implemented**: Offset-based pagination (`page`, `limit`, `skip`).

**What was cut**: Cursor-based pagination (more performant for large datasets and consistent with real-time updates).

**Why**: Offset pagination is simpler to implement and easier to reason about in UIs with page numbers. The requirement was simply "implement pagination" — offset satisfies that.

**Production path**: For >100k records or live-updating lists, migrate to cursor-based pagination using `cursor` + `take` in Prisma.

---

## 5. No File/Asset Uploads

**What was cut**: Lesson attachments (PDFs, videos, images), profile pictures.

**Why**: Requires S3/object storage integration, multipart upload handling, and CDN configuration. Out of scope for L1.

**Production path**: Use AWS S3 (or equivalent). Pre-sign upload URLs from the backend. Store asset URLs in the database. Use CloudFront for CDN delivery.

---

## 6. No WebSockets / Real-Time Updates

**What was cut**: Live booking notifications, real-time schedule updates.

**Why**: Adds infrastructure complexity (Socket.io or SSE), state synchronization challenges. Not needed for L1 correctness.

**Production path**: Use Socket.io or SSE for booking approval notifications. Consider Redis pub/sub for multi-instance deployments.

---

## 7. Basic Error Handling (No Sentry / Structured Logging)

**What was implemented**: Console logging, standardized `sendError` utility, `morgan` HTTP logging.

**What was cut**: Structured logging (Pino/Winston), error tracking (Sentry), log aggregation.

**Production path**: Replace `console.log` with Pino (structured JSON). Add Sentry for backend error tracking. Ship logs to Datadog or CloudWatch.

---

## 8. Docker Dev Mode Uses ts-node (Not Compiled)

**What was implemented**: The `docker-compose.yml` builds TypeScript and runs the compiled output for production-like correctness.

**Note**: The local `dev` script uses `ts-node-dev` for hot reloading.

**Why**: The production Dockerfile compiles with `tsc` — no compromise here. The dev workflow uses `ts-node-dev` for speed.

---

## 9. No Rate Limiting

**What was cut**: Express rate limiting middleware (e.g., `express-rate-limit`) on auth endpoints.

**Why**: Implementation is trivial but adds a dependency. Auth endpoints are the highest risk, but for a local/assessment deployment, it's acceptable.

**Production path**: Add `express-rate-limit` with Redis store (`rate-limit-redis`) for multi-instance support. Apply strict limits (5 req/min) on `/auth/login` and `/auth/register`.

---

## 10. Frontend Course Creation UI (Partial)

**What was cut**: Full course/module/lesson creation forms in the frontend.

**What was implemented**: Full read flow + quiz engine on frontend. Create endpoints are fully implemented in the backend and testable via API.

**Why**: CRUD forms for the full course hierarchy (course → module → lesson with N questions) is significant UI surface area. The backend is complete; the frontend prioritized the assessment-differentiated features (quiz engine, calendar, RBAC enforcement).

**Production path**: Add instructor-facing course builder with drag-and-drop module ordering, inline question editor, and preview mode.
