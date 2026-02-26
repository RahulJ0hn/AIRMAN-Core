import { prisma } from "../config/prisma";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";
import { PaginationQuery } from "../types";

export async function listCourses(query: PaginationQuery) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search?.trim();

  const where = search
    ? { title: { contains: search, mode: "insensitive" as const } }
    : {};

  const [total, data] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { modules: true } },
      },
    }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
}

export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, type: true, order: true },
          },
        },
      },
    },
  });
}

export async function createCourse(data: {
  title: string;
  description?: string;
  createdById: string;
}) {
  return prisma.course.create({
    data,
    include: { createdBy: { select: { id: true, name: true } } },
  });
}

export async function updateCourse(id: string, data: { title?: string; description?: string }) {
  return prisma.course.update({ where: { id }, data });
}

export async function deleteCourse(id: string) {
  return prisma.course.delete({ where: { id } });
}

// ── Module ────────────────────────────────────

export async function listModules(courseId: string) {
  return prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function createModule(data: {
  title: string;
  order?: number;
  courseId: string;
}) {
  return prisma.module.create({ data });
}

export async function updateModule(id: string, data: { title?: string; order?: number }) {
  return prisma.module.update({ where: { id }, data });
}

export async function deleteModule(id: string) {
  return prisma.module.delete({ where: { id } });
}

// ── Lesson ────────────────────────────────────

export async function listLessons(moduleId: string) {
  return prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { order: "asc" },
    include: { _count: { select: { questions: true } } },
  });
}

export async function getLessonById(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!lesson) return null;
  // Backward-compat: options may have been double-JSON-encoded as a string
  return {
    ...lesson,
    questions: lesson.questions.map((q) => ({
      ...q,
      options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
    })),
  };
}

export async function createLesson(data: {
  title: string;
  type: "TEXT" | "MCQ_QUIZ";
  order?: number;
  content?: string;
  moduleId: string;
  questions?: Array<{
    text: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    order?: number;
  }>;
}) {
  const { questions, ...lessonData } = data;

  return prisma.lesson.create({
    data: {
      ...lessonData,
      questions: questions
        ? {
            create: questions.map((q) => ({
              ...q,
              options: q.options,
            })),
          }
        : undefined,
    },
    include: { questions: true },
  });
}

export async function updateLesson(
  id: string,
  data: { title?: string; content?: string; order?: number }
) {
  return prisma.lesson.update({ where: { id }, data });
}

export async function deleteLesson(id: string) {
  return prisma.lesson.delete({ where: { id } });
}
