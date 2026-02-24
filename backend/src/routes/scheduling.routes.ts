import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as schedulingCtrl from "../controllers/scheduling.controller";

const router = Router();

router.use(authenticate);

// ── Availability ───────────────────────────────
router.get("/availability", schedulingCtrl.listAvailabilities);
router.post(
  "/availability",
  authorize("INSTRUCTOR"),
  schedulingCtrl.availabilityValidation,
  validate,
  schedulingCtrl.createAvailability
);
router.delete(
  "/availability/:id",
  authorize("INSTRUCTOR"),
  schedulingCtrl.deleteAvailability
);

// ── Bookings ───────────────────────────────────
router.get("/bookings", schedulingCtrl.listBookings);
router.post(
  "/bookings",
  authorize("STUDENT"),
  schedulingCtrl.bookingValidation,
  validate,
  schedulingCtrl.createBooking
);
router.patch(
  "/bookings/:id/status",
  authorize("INSTRUCTOR", "ADMIN", "STUDENT"),
  [body("status").isIn(["REQUESTED", "APPROVED", "COMPLETED", "CANCELLED"])],
  validate,
  schedulingCtrl.updateBookingStatus
);

// ── Calendar ───────────────────────────────────
router.get("/calendar", schedulingCtrl.weeklyCalendar);

export default router;
