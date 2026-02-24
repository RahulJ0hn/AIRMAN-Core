import { prisma } from "../config/prisma";
import { BookingStatus } from "@prisma/client";
import { PaginationQuery } from "../types";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

// ── Availability ─────────────────────────────

export async function createAvailability(
  instructorId: string,
  startTime: Date,
  endTime: Date
) {
  if (endTime <= startTime) throw new Error("End time must be after start time");

  // Conflict check: no overlapping slots for this instructor
  const conflict = await prisma.availability.findFirst({
    where: {
      instructorId,
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
  });

  if (conflict) {
    throw new Error(
      `Availability overlaps with an existing slot from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`
    );
  }

  return prisma.availability.create({
    data: { instructorId, startTime, endTime },
    include: { instructor: { select: { id: true, name: true, email: true } } },
  });
}

export async function listAvailabilities(instructorId?: string) {
  const where = instructorId ? { instructorId } : {};
  return prisma.availability.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { bookings: true } },
    },
  });
}

export async function deleteAvailability(id: string, instructorId: string) {
  const slot = await prisma.availability.findUnique({ where: { id } });
  if (!slot) throw new Error("Availability slot not found");
  if (slot.instructorId !== instructorId) throw new Error("Access denied");

  const activeBookings = await prisma.booking.count({
    where: {
      availabilityId: id,
      status: { in: [BookingStatus.REQUESTED, BookingStatus.APPROVED] },
    },
  });

  if (activeBookings > 0) {
    throw new Error("Cannot delete slot with active bookings");
  }

  return prisma.availability.delete({ where: { id } });
}

// ── Booking ───────────────────────────────────

/**
 * HARD REQUIREMENT: Conflict Detection
 * Prevents double-booking an instructor within the same time window.
 * Checks across ALL active bookings (REQUESTED + APPROVED).
 */
export async function detectBookingConflict(
  instructorId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const where = {
    instructorId,
    status: { in: [BookingStatus.REQUESTED, BookingStatus.APPROVED] },
    AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
  };

  const count = await prisma.booking.count({ where });
  return count > 0;
}

export async function createBooking(
  studentId: string,
  instructorId: string,
  startTime: Date,
  endTime: Date,
  notes?: string,
  availabilityId?: string
) {
  if (endTime <= startTime) throw new Error("End time must be after start time");

  // Conflict detection — core hard requirement
  const hasConflict = await detectBookingConflict(instructorId, startTime, endTime);
  if (hasConflict) {
    throw new Error(
      "Booking conflict: the instructor already has an approved or requested booking in this time window"
    );
  }

  // Validate availability slot if provided
  if (availabilityId) {
    const slot = await prisma.availability.findUnique({ where: { id: availabilityId } });
    if (!slot) throw new Error("Availability slot not found");
    if (slot.instructorId !== instructorId) throw new Error("Slot does not belong to this instructor");
    if (startTime < slot.startTime || endTime > slot.endTime) {
      throw new Error("Booking time must be within the availability slot");
    }
  }

  return prisma.booking.create({
    data: {
      studentId,
      instructorId,
      startTime,
      endTime,
      notes,
      availabilityId,
      status: BookingStatus.REQUESTED,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
      availability: true,
    },
  });
}

export async function listBookings(
  userId: string,
  userRole: string,
  query: PaginationQuery & { status?: BookingStatus }
) {
  const { page, limit, skip } = parsePagination(query);

  const where =
    userRole === "ADMIN"
      ? query.status ? { status: query.status } : {}
      : userRole === "INSTRUCTOR"
      ? { instructorId: userId, ...(query.status ? { status: query.status } : {}) }
      : { studentId: userId, ...(query.status ? { status: query.status } : {}) };

  const [total, data] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: "asc" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        instructor: { select: { id: true, name: true, email: true } },
        availability: true,
      },
    }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  actorId: string,
  actorRole: string
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking not found");

  // Access control
  if (actorRole === "INSTRUCTOR" && booking.instructorId !== actorId) {
    throw new Error("Access denied");
  }
  if (actorRole === "STUDENT") {
    // Students can only cancel their own bookings
    if (booking.studentId !== actorId) throw new Error("Access denied");
    if (status !== BookingStatus.CANCELLED) throw new Error("Students can only cancel bookings");
  }

  // When approving, re-check for conflicts (race-condition guard)
  if (status === BookingStatus.APPROVED) {
    const hasConflict = await detectBookingConflict(
      booking.instructorId,
      booking.startTime,
      booking.endTime,
      id
    );
    if (hasConflict) {
      throw new Error("Cannot approve: instructor already has a conflicting approved booking");
    }
  }

  return prisma.booking.update({
    where: { id },
    data: { status },
    include: {
      student: { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getWeeklyCalendar(
  instructorId: string,
  weekStart: Date
): Promise<{ availabilities: unknown[]; bookings: unknown[] }> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [availabilities, bookings] = await Promise.all([
    prisma.availability.findMany({
      where: {
        instructorId,
        startTime: { gte: weekStart },
        endTime: { lte: weekEnd },
      },
      include: { instructor: { select: { id: true, name: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        instructorId,
        startTime: { gte: weekStart },
        endTime: { lte: weekEnd },
        status: { in: [BookingStatus.REQUESTED, BookingStatus.APPROVED] },
      },
      include: {
        student: { select: { id: true, name: true } },
        instructor: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return { availabilities, bookings };
}
