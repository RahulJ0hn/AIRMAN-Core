import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as courseCtrl from "../controllers/course.controller";
import * as quizCtrl from "../controllers/quiz.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Courses ────────────────────────────────────
router.get("/", courseCtrl.listCourses);
router.get("/:id", courseCtrl.getCourse);
router.post(
  "/",
  authorize("INSTRUCTOR", "ADMIN"),
  courseCtrl.courseValidation,
  validate,
  courseCtrl.createCourse
);
router.put(
  "/:id",
  authorize("INSTRUCTOR", "ADMIN"),
  courseCtrl.courseValidation,
  validate,
  courseCtrl.updateCourse
);
router.delete("/:id", authorize("ADMIN"), courseCtrl.deleteCourse);

// ── Modules ────────────────────────────────────
router.get("/:courseId/modules", courseCtrl.listModules);
router.post(
  "/:courseId/modules",
  authorize("INSTRUCTOR", "ADMIN"),
  courseCtrl.moduleValidation,
  validate,
  courseCtrl.createModule
);

export default router;
