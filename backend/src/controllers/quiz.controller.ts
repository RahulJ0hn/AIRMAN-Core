import { Response } from "express";
import { body } from "express-validator";
import * as quizService from "../services/quiz.service";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";

export const submitValidation = [
  body("answers").isArray({ min: 1 }).withMessage("Answers array is required"),
  body("answers.*.questionId").isString().notEmpty(),
  body("answers.*.selectedIndex").isInt({ min: 0 }),
];

export async function submitAttempt(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await quizService.submitQuizAttempt(
      req.user!.userId,
      req.params.lessonId,
      req.body.answers
    );
    sendSuccess(res, result, 201, "Quiz submitted");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function myAttempts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await quizService.getUserAttempts(req.user!.userId, req.query as { page?: string; limit?: string });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getAttempt(req: AuthRequest, res: Response): Promise<void> {
  try {
    const attempt = await quizService.getAttemptById(req.params.id, req.user!.userId);
    sendSuccess(res, attempt);
  } catch (err) {
    const status = (err as Error).message === "Access denied" ? 403 : 404;
    sendError(res, (err as Error).message, status);
  }
}
