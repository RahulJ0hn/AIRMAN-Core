import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as quizCtrl from "../controllers/quiz.controller";

const router = Router();

router.use(authenticate);

router.get("/attempts", quizCtrl.myAttempts);
router.get("/attempts/:id", quizCtrl.getAttempt);

export default router;
