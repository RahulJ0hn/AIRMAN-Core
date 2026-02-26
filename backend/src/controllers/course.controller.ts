import { Response } from "express";
import { body } from "express-validator";
import * as courseService from "../services/course.service";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";

// ── Validation ────────────────────────────────

export const courseValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional().trim(),
];

export const moduleValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("order").optional().isInt({ min: 0 }),
];

export const lessonValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("type").isIn(["TEXT", "MCQ_QUIZ"]).withMessage("Type must be TEXT or MCQ_QUIZ"),
  body("order").optional().isInt({ min: 0 }),
  body("content").optional().trim(),
  body("questions").optional().isArray(),
];

// ── Course Controllers ────────────────────────

export async function listCourses(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await courseService.listCourses(req.query as { page?: string; limit?: string; search?: string });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) { sendError(res, "Course not found", 404); return; }
    sendSuccess(res, course);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const course = await courseService.createCourse({
      ...req.body,
      createdById: req.user!.userId,
    });
    sendSuccess(res, course, 201, "Course created");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    sendSuccess(res, course, 200, "Course updated");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function deleteCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    await courseService.deleteCourse(req.params.id);
    sendSuccess(res, null, 200, "Course deleted");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

// ── Module Controllers ────────────────────────

export async function listModules(req: AuthRequest, res: Response): Promise<void> {
  try {
    const modules = await courseService.listModules(req.params.courseId);
    sendSuccess(res, modules);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createModule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const module = await courseService.createModule({
      ...req.body,
      courseId: req.params.courseId,
    });
    sendSuccess(res, module, 201, "Module created");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateModule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const module = await courseService.updateModule(req.params.id, req.body);
    sendSuccess(res, module, 200, "Module updated");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function deleteModule(req: AuthRequest, res: Response): Promise<void> {
  try {
    await courseService.deleteModule(req.params.id);
    sendSuccess(res, null, 200, "Module deleted");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

// ── Lesson Controllers ────────────────────────

export async function listLessons(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lessons = await courseService.listLessons(req.params.moduleId);
    sendSuccess(res, lessons);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function getLesson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lesson = await courseService.getLessonById(req.params.id);
    if (!lesson) { sendError(res, "Lesson not found", 404); return; }
    sendSuccess(res, lesson);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createLesson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lesson = await courseService.createLesson({
      ...req.body,
      moduleId: req.params.moduleId,
    });
    sendSuccess(res, lesson, 201, "Lesson created");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateLesson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const lesson = await courseService.updateLesson(req.params.id, req.body);
    sendSuccess(res, lesson, 200, "Lesson updated");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function deleteLesson(req: AuthRequest, res: Response): Promise<void> {
  try {
    await courseService.deleteLesson(req.params.id);
    sendSuccess(res, null, 200, "Lesson deleted");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
