import { prisma } from "../config/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PaginationQuery } from "../types";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

const SALT_ROUNDS = 12;

export async function listUsers(query: PaginationQuery & { role?: Role }) {
  const { page, limit, skip } = parsePagination(query);
  const where = query.role ? { role: query.role } : {};

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
}

export async function createInstructor(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: Role.INSTRUCTOR,
      approved: true,
    },
    select: { id: true, email: true, name: true, role: true, approved: true, createdAt: true },
  });
}

export async function approveStudent(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.role !== Role.STUDENT) throw new Error("User is not a student");

  return prisma.user.update({
    where: { id: userId },
    data: { approved: true },
    select: { id: true, email: true, name: true, role: true, approved: true },
  });
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.role === Role.ADMIN) throw new Error("Cannot delete admin user");

  return prisma.user.delete({ where: { id: userId } });
}
