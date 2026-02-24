import { Request, Response } from "express";
import { body } from "express-validator";
import { registerUser, loginUser, getUserById } from "../services/auth.service";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";

export const registerValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").trim().notEmpty().withMessage("Name is required"),
];

export const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const user = await registerUser(req.body);
    sendSuccess(res, user, 201, "Registration successful. Await admin approval.");
  } catch (err) {
    sendError(res, (err as Error).message, 400);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const result = await loginUser(req.body);
    sendSuccess(res, result, 200, "Login successful");
  } catch (err) {
    sendError(res, (err as Error).message, 401);
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
