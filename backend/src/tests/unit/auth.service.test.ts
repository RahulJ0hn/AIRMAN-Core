/**
 * Unit Tests: Auth Service
 * Tests password hashing, JWT generation, and login validation logic.
 * Uses mocked Prisma client — no database required.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";

// ── Mock Prisma ────────────────────────────────
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock("../../config/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

// Set env before importing services
process.env.JWT_SECRET = "test_secret_key";
process.env.JWT_EXPIRES_IN = "1h";

import { registerUser, loginUser } from "../../services/auth.service";

describe("Auth Service — Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── registerUser ────────────────────────────

  describe("registerUser", () => {
    it("should throw if email is already registered", async () => {
      mockFindUnique.mockResolvedValueOnce({ id: "existing-id", email: "test@test.com" });

      await expect(
        registerUser({ email: "test@test.com", password: "pass123", name: "Test" })
      ).rejects.toThrow("Email already registered");
    });

    it("should hash the password before storing", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate.mockImplementationOnce(async (args: { data: { password: string } }) => {
        // Verify password is hashed (not plaintext)
        const isHashed = await bcrypt.compare("mypassword", args.data.password);
        expect(isHashed).toBe(true);
        return {
          id: "new-id",
          email: "new@test.com",
          name: "New User",
          role: "STUDENT",
          approved: false,
          createdAt: new Date(),
        };
      });

      const user = await registerUser({
        email: "new@test.com",
        password: "mypassword",
        name: "New User",
      });

      expect(user.email).toBe("new@test.com");
      expect(user.role).toBe("STUDENT");
    });

    it("should set approved=false for students by default", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate.mockImplementationOnce(async (args: { data: { approved: boolean } }) => {
        expect(args.data.approved).toBe(false);
        return {
          id: "student-id",
          email: "student@test.com",
          name: "Student",
          role: "STUDENT",
          approved: false,
          createdAt: new Date(),
        };
      });

      await registerUser({ email: "student@test.com", password: "pass123", name: "Student" });
    });

    it("should set approved=true for instructors", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate.mockImplementationOnce(async (args: { data: { approved: boolean; role: string } }) => {
        expect(args.data.approved).toBe(true);
        expect(args.data.role).toBe("INSTRUCTOR");
        return {
          id: "instructor-id",
          email: "inst@test.com",
          name: "Instructor",
          role: "INSTRUCTOR",
          approved: true,
          createdAt: new Date(),
        };
      });

      await registerUser({
        email: "inst@test.com",
        password: "pass123",
        name: "Instructor",
        role: "INSTRUCTOR",
      });
    });
  });

  // ── loginUser ────────────────────────────────

  describe("loginUser", () => {
    it("should throw on unknown email", async () => {
      mockFindUnique.mockResolvedValueOnce(null);
      await expect(
        loginUser({ email: "ghost@test.com", password: "pass" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw on wrong password", async () => {
      const hashed = await bcrypt.hash("correct_pass", 10);
      mockFindUnique.mockResolvedValueOnce({
        id: "uid",
        email: "user@test.com",
        password: hashed,
        role: "STUDENT",
        approved: true,
        name: "User",
      });

      await expect(
        loginUser({ email: "user@test.com", password: "wrong_pass" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw if account not approved", async () => {
      const hashed = await bcrypt.hash("pass123", 10);
      mockFindUnique.mockResolvedValueOnce({
        id: "uid",
        email: "pending@test.com",
        password: hashed,
        role: "STUDENT",
        approved: false,
        name: "Pending",
      });

      await expect(
        loginUser({ email: "pending@test.com", password: "pass123" })
      ).rejects.toThrow("Account pending approval");
    });

    it("should return a valid JWT on successful login", async () => {
      const hashed = await bcrypt.hash("pass123", 10);
      mockFindUnique.mockResolvedValueOnce({
        id: "uid-123",
        email: "ok@test.com",
        password: hashed,
        role: "STUDENT",
        approved: true,
        name: "OK User",
      });

      const result = await loginUser({ email: "ok@test.com", password: "pass123" });

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe("ok@test.com");

      // Verify JWT payload
      const decoded = jwt.verify(result.token, "test_secret_key") as {
        userId: string;
        role: string;
        email: string;
      };
      expect(decoded.userId).toBe("uid-123");
      expect(decoded.role).toBe("STUDENT");
    });
  });
});
