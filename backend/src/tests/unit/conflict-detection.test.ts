/**
 * Unit Tests: Booking Conflict Detection
 * Tests the core scheduling conflict detection algorithm.
 * Uses mocked Prisma — no database required.
 */

import { jest } from "@jest/globals";

// ── Mock Prisma ────────────────────────────────
const mockBookingCount = jest.fn();

jest.mock("../../config/prisma", () => ({
  prisma: {
    booking: {
      count: (...args: unknown[]) => mockBookingCount(...args),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    availability: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { detectBookingConflict } from "../../services/scheduling.service";

const INSTRUCTOR_ID = "instructor-uuid-001";

// Helper: create Date objects with a fixed day
function makeDate(hour: number, minute = 0): Date {
  const d = new Date("2025-06-15T00:00:00Z");
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

describe("Conflict Detection — Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns false when no conflicting bookings exist", async () => {
    mockBookingCount.mockResolvedValueOnce(0);

    const result = await detectBookingConflict(
      INSTRUCTOR_ID,
      makeDate(9),
      makeDate(10)
    );

    expect(result).toBe(false);
    expect(mockBookingCount).toHaveBeenCalledTimes(1);
  });

  it("returns true when an exact overlap exists", async () => {
    mockBookingCount.mockResolvedValueOnce(1);

    const result = await detectBookingConflict(
      INSTRUCTOR_ID,
      makeDate(9),
      makeDate(10)
    );

    expect(result).toBe(true);
  });

  it("returns true when new booking starts inside existing booking", async () => {
    // Existing: 09:00-11:00, New: 10:00-12:00 → overlap
    mockBookingCount.mockResolvedValueOnce(1);

    const result = await detectBookingConflict(
      INSTRUCTOR_ID,
      makeDate(10),
      makeDate(12)
    );

    expect(result).toBe(true);
  });

  it("returns true when new booking completely contains an existing booking", async () => {
    // Existing: 10:00-11:00, New: 09:00-12:00 → overlap
    mockBookingCount.mockResolvedValueOnce(1);

    const result = await detectBookingConflict(
      INSTRUCTOR_ID,
      makeDate(9),
      makeDate(12)
    );

    expect(result).toBe(true);
  });

  it("returns false when bookings are adjacent (no gap needed)", async () => {
    // Existing: 09:00-10:00, New: 10:00-11:00 → no overlap (touching is ok)
    mockBookingCount.mockResolvedValueOnce(0);

    const result = await detectBookingConflict(
      INSTRUCTOR_ID,
      makeDate(10),
      makeDate(11)
    );

    expect(result).toBe(false);
  });

  it("passes correct WHERE clause to prisma (start < end AND end > start)", async () => {
    mockBookingCount.mockResolvedValueOnce(0);
    const start = makeDate(9);
    const end = makeDate(10);

    await detectBookingConflict(INSTRUCTOR_ID, start, end);

    const callArgs = mockBookingCount.mock.calls[0][0] as {
      where: {
        instructorId: string;
        AND: Array<{ startTime?: { lt: Date }; endTime?: { gt: Date } }>;
      };
    };

    expect(callArgs.where.instructorId).toBe(INSTRUCTOR_ID);
    expect(callArgs.where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: { lt: end } }),
        expect.objectContaining({ endTime: { gt: start } }),
      ])
    );
  });

  it("excludes a specific booking ID when checking for re-approval conflicts", async () => {
    mockBookingCount.mockResolvedValueOnce(0);

    await detectBookingConflict(
      INSTRUCTOR_ID,
      makeDate(9),
      makeDate(10),
      "exclude-booking-id"
    );

    const callArgs = mockBookingCount.mock.calls[0][0] as {
      where: { NOT?: { id: string } };
    };
    expect(callArgs.where.NOT).toEqual({ id: "exclude-booking-id" });
  });

  it("only considers REQUESTED and APPROVED bookings — not COMPLETED/CANCELLED", async () => {
    mockBookingCount.mockResolvedValueOnce(0);

    await detectBookingConflict(INSTRUCTOR_ID, makeDate(9), makeDate(10));

    const callArgs = mockBookingCount.mock.calls[0][0] as {
      where: { status: { in: string[] } };
    };
    expect(callArgs.where.status.in).toContain("REQUESTED");
    expect(callArgs.where.status.in).toContain("APPROVED");
    expect(callArgs.where.status.in).not.toContain("COMPLETED");
    expect(callArgs.where.status.in).not.toContain("CANCELLED");
  });
});
