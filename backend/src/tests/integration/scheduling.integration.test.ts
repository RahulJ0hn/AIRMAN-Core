/**
 * Integration Test: Scheduling — Conflict Detection
 * Tests booking conflict detection against a real database.
 */

import supertest from "supertest";
import { app } from "../../index";
import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const request = supertest(app);

let instructorToken: string;
let studentToken: string;
let instructorId: string;
let studentId: string;
let availabilityId: string;

const TS = Date.now();
const INSTRUCTOR_EMAIL = `integ-instructor-${TS}@airman.dev`;
const STUDENT_EMAIL = `integ-student-${TS}@airman.dev`;

async function createUser(
  email: string,
  role: Role,
  name: string
): Promise<{ id: string; token: string }> {
  const hashed = await bcrypt.hash("TestPass123!", 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, role, approved: true },
  });
  const res = await request
    .post("/api/auth/login")
    .send({ email, password: "TestPass123!" });
  return { id: user.id, token: res.body.data.token };
}

beforeAll(async () => {
  const instructor = await createUser(INSTRUCTOR_EMAIL, Role.INSTRUCTOR, "Test Instructor");
  const student = await createUser(STUDENT_EMAIL, Role.STUDENT, "Test Student");
  instructorId = instructor.id;
  studentId = student.id;
  instructorToken = instructor.token;
  studentToken = student.token;
});

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { instructorId } });
  await prisma.availability.deleteMany({ where: { instructorId } });
  await prisma.user.deleteMany({ where: { id: { in: [instructorId, studentId] } } });
  await prisma.$disconnect();
});

describe("Scheduling Integration Tests", () => {
  const SLOT_START = new Date("2026-08-01T09:00:00Z");
  const SLOT_END = new Date("2026-08-01T17:00:00Z");
  const BOOK_START = new Date("2026-08-01T10:00:00Z");
  const BOOK_END = new Date("2026-08-01T11:00:00Z");

  // ── Availability ─────────────────────────────

  it("INSTRUCTOR: can create availability slot", async () => {
    const res = await request
      .post("/api/scheduling/availability")
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ startTime: SLOT_START.toISOString(), endTime: SLOT_END.toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.data.instructorId).toBe(instructorId);
    availabilityId = res.body.data.id;
  });

  it("STUDENT: cannot create availability (403)", async () => {
    const res = await request
      .post("/api/scheduling/availability")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ startTime: SLOT_START.toISOString(), endTime: SLOT_END.toISOString() });

    expect(res.status).toBe(403);
  });

  // ── Booking ───────────────────────────────────

  let firstBookingId: string;

  it("STUDENT: can request a booking", async () => {
    const res = await request
      .post("/api/scheduling/bookings")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        instructorId,
        startTime: BOOK_START.toISOString(),
        endTime: BOOK_END.toISOString(),
        notes: "First lesson",
        availabilityId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("REQUESTED");
    firstBookingId = res.body.data.id;
  });

  it("CONFLICT: duplicate booking in same window returns 400", async () => {
    const res = await request
      .post("/api/scheduling/bookings")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        instructorId,
        startTime: BOOK_START.toISOString(),
        endTime: BOOK_END.toISOString(),
        notes: "Duplicate attempt",
        availabilityId,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/conflict/i);
  });

  it("CONFLICT: overlapping (not identical) window also blocked", async () => {
    const overlapStart = new Date("2026-08-01T10:30:00Z");
    const overlapEnd = new Date("2026-08-01T11:30:00Z");

    const res = await request
      .post("/api/scheduling/bookings")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        instructorId,
        startTime: overlapStart.toISOString(),
        endTime: overlapEnd.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/conflict/i);
  });

  it("INSTRUCTOR: can approve booking", async () => {
    const res = await request
      .patch(`/api/scheduling/bookings/${firstBookingId}/status`)
      .set("Authorization", `Bearer ${instructorToken}`)
      .send({ status: "APPROVED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("APPROVED");
  });

  it("STUDENT: can cancel own booking", async () => {
    const res = await request
      .patch(`/api/scheduling/bookings/${firstBookingId}/status`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CANCELLED");
  });

  it("STUDENT: booking after cancellation is accepted (no longer conflicting)", async () => {
    const res = await request
      .post("/api/scheduling/bookings")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        instructorId,
        startTime: BOOK_START.toISOString(),
        endTime: BOOK_END.toISOString(),
        availabilityId,
      });

    // The previous booking was cancelled, so this should succeed
    expect(res.status).toBe(201);
  });
});
