import { Response } from "express";
import { body } from "express-validator";
import * as adminService from "../services/admin.service";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";
import { Role } from "@prisma/client";

export const createInstructorValidation = [
  body("email").isEmail().normalizeEmail(),
  body("name").trim().notEmpty(),
  body("password").isLength({ min: 6 }),
];

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const role = req.query.role as Role | undefined;
    const result = await adminService.listUsers({
      ...req.query as { page?: string; limit?: string },
      role,
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function createInstructor(req: AuthRequest, res: Response): Promise<void> {
  try {
    const instructor = await adminService.createInstructor(
      req.body.email,
      req.body.name,
      req.body.password
    );
    sendSuccess(res, instructor, 201, "Instructor created");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function approveStudent(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await adminService.approveStudent(req.params.userId);
    sendSuccess(res, user, 200, "Student approved");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    await adminService.deleteUser(req.params.userId);
    sendSuccess(res, null, 200, "User deleted");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}
