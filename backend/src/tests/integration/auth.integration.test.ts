/**
 * Integration Test: Auth Endpoints
 * Hits real database (test DB via DATABASE_URL env).
 * Cleans up created test records after each run.
 */

import supertest from "supertest";
import { app } from "../../index";
import { prisma } from "../../config/prisma";

const request = supertest(app);
const TEST_EMAIL = `integ-test-${Date.now()}@airman.dev`;
const TEST_PASSWORD = "Integration123!";

afterAll(async () => {
  // Cleanup test user
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("creates a new student and returns 201", async () => {
    const res = await request.post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: "Integration Test Student",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(TEST_EMAIL);
    expect(res.body.data.role).toBe("STUDENT");
    expect(res.body.data.approved).toBe(false);
  });

  it("rejects duplicate email with 400", async () => {
    const res = await request.post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: "Duplicate",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects short password with 422", async () => {
    const res = await request.post("/api/auth/register").send({
      email: "short@test.com",
      password: "12",
      name: "Short",
    });

    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 401 for unapproved student", async () => {
    const res = await request.post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/pending/i);
  });

  it("returns 401 for wrong password", async () => {
    const res = await request.post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: "wrong_password",
    });

    expect(res.status).toBe(401);
  });

  it("returns JWT after approving and logging in", async () => {
    // Manually approve
    await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: { approved: true },
    });

    const res = await request.post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
  });
});

describe("GET /api/auth/me", () => {
  let token: string;

  beforeAll(async () => {
    // Approve and login
    await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: { approved: true },
    });
    const res = await request.post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    token = res.body.data.token;
  });

  it("returns user profile when authenticated", async () => {
    const res = await request
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_EMAIL);
  });

  it("returns 401 without token", async () => {
    const res = await request.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
