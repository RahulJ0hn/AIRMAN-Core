import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { config } from "../config/env";
import { Role } from "@prisma/client";

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const SALT_ROUNDS = 12;

export async function registerUser(payload: RegisterPayload) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const role = payload.role ?? Role.STUDENT;

  // Admin and instructors created by admin are auto-approved
  const approved = role === Role.ADMIN || role === Role.INSTRUCTOR;

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      password: hashed,
      name: payload.name,
      role,
      approved,
    },
    select: { id: true, email: true, name: true, role: true, approved: true, createdAt: true },
  });

  return user;
}

export async function loginUser(payload: LoginPayload) {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(payload.password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  if (!user.approved) throw new Error("Account pending approval by admin");

  const tokenPayload = { userId: user.id, role: user.role, email: user.email };
  const token = jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, approved: true, createdAt: true },
  });
}
