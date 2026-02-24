import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as courseCtrl from "../controllers/course.controller";

const router = Router();

router.use(authenticate);

router.put(
  "/:id",
  authorize("INSTRUCTOR", "ADMIN"),
  courseCtrl.moduleValidation,
  validate,
  courseCtrl.updateModule
);
router.delete("/:id", authorize("INSTRUCTOR", "ADMIN"), courseCtrl.deleteModule);

// ── Lessons within a module ────────────────────
router.get("/:moduleId/lessons", courseCtrl.listLessons);
router.post(
  "/:moduleId/lessons",
  authorize("INSTRUCTOR", "ADMIN"),
  courseCtrl.lessonValidation,
  validate,
  courseCtrl.createLesson
);

export default router;
