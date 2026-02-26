import { Response } from "express";
import { body } from "express-validator";
import * as schedulingService from "../services/scheduling.service";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";
import { BookingStatus } from "@prisma/client";

export const availabilityValidation = [
  body("startTime").isISO8601().toDate().withMessage("Valid startTime required"),
  body("endTime").isISO8601().toDate().withMessage("Valid endTime required"),
];

export const bookingValidation = [
  body("instructorId").isString().notEmpty(),
  body("startTime").isISO8601().toDate(),
  body("endTime").isISO8601().toDate(),
  body("notes").optional().trim(),
  body("availabilityId").optional().isString(),
];

// ── Availability ─────────────────────────────

export async function createAvailability(req: AuthRequest, res: Response): Promise<void> {
  try {
    const slot = await schedulingService.createAvailability(
      req.user!.userId,
      new Date(req.body.startTime),
      new Date(req.body.endTime)
    );
    sendSuccess(res, slot, 201, "Availability created");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function listAvailabilities(req: AuthRequest, res: Response): Promise<void> {
  try {
    const instructorId = req.query.instructorId as string | undefined;
    const slots = await schedulingService.listAvailabilities(instructorId);
    sendSuccess(res, slots);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function deleteAvailability(req: AuthRequest, res: Response): Promise<void> {
  try {
    await schedulingService.deleteAvailability(req.params.id, req.user!.userId);
    sendSuccess(res, null, 200, "Availability deleted");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

// ── Bookings ──────────────────────────────────

export async function createBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const booking = await schedulingService.createBooking(
      req.user!.userId,
      req.body.instructorId,
      new Date(req.body.startTime),
      new Date(req.body.endTime),
      req.body.notes,
      req.body.availabilityId
    );
    sendSuccess(res, booking, 201, "Booking requested");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function listBookings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await schedulingService.listBookings(
      req.user!.userId,
      req.user!.role,
      req.query as { page?: string; limit?: string; status?: BookingStatus }
    );
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateBookingStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const booking = await schedulingService.updateBookingStatus(
      req.params.id,
      req.body.status as BookingStatus,
      req.user!.userId,
      req.user!.role
    );
    sendSuccess(res, booking, 200, "Booking status updated");
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes("denied") ? 403 : msg.includes("conflict") ? 409 : 400;
    sendError(res, msg, status);
  }
}

export async function weeklyCalendar(req: AuthRequest, res: Response): Promise<void> {
  try {
    const instructorId = req.query.instructorId as string || req.user!.userId;
    const weekStart = req.query.weekStart
      ? new Date(req.query.weekStart as string)
      : (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - d.getDay()); // Sunday
          return d;
        })();

    const calendar = await schedulingService.getWeeklyCalendar(instructorId, weekStart);
    sendSuccess(res, calendar);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
