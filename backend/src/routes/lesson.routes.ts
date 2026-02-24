import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as courseCtrl from "../controllers/course.controller";
import * as quizCtrl from "../controllers/quiz.controller";

const router = Router();

router.use(authenticate);

router.get("/:id", courseCtrl.getLesson);
router.put(
  "/:id",
  authorize("INSTRUCTOR", "ADMIN"),
  courseCtrl.lessonValidation,
  validate,
  courseCtrl.updateLesson
);
router.delete("/:id", authorize("INSTRUCTOR", "ADMIN"), courseCtrl.deleteLesson);

// Quiz engine
router.post(
  "/:lessonId/attempt",
  authorize("STUDENT"),
  quizCtrl.submitValidation,
  validate,
  quizCtrl.submitAttempt
);

export default router;
