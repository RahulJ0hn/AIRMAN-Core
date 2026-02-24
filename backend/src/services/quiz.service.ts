import { prisma } from "../config/prisma";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";
import { PaginationQuery } from "../types";

interface AnswerInput {
  questionId: string;
  selectedIndex: number;
}

export async function submitQuizAttempt(
  userId: string,
  lessonId: string,
  answers: AnswerInput[]
) {
  // Fetch lesson with questions
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!lesson) throw new Error("Lesson not found");
  if (lesson.type !== "MCQ_QUIZ") throw new Error("Lesson is not a quiz");
  if (!lesson.questions.length) throw new Error("Quiz has no questions");

  // Grade answers
  const questionMap = new Map(lesson.questions.map((q) => [q.id, q]));
  let correct = 0;

  const gradedAnswers = answers.map((ans) => {
    const question = questionMap.get(ans.questionId);
    if (!question) throw new Error(`Question ${ans.questionId} not found in this lesson`);

    const isCorrect = ans.selectedIndex === question.correctIndex;
    if (isCorrect) correct++;

    return {
      questionId: ans.questionId,
      selectedIndex: ans.selectedIndex,
      isCorrect,
    };
  });

  const totalQ = lesson.questions.length;
  const score = (correct / totalQ) * 100;
  const passed = score >= 70; // 70% pass threshold

  // Persist attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      lessonId,
      score,
      totalQ,
      correct,
      passed,
      answers: {
        create: gradedAnswers,
      },
    },
    include: {
      answers: {
        include: {
          question: {
            select: {
              id: true,
              text: true,
              options: true,
              correctIndex: true,
              explanation: true,
              order: true,
            },
          },
        },
      },
    },
  });

  // Identify incorrect questions for review
  const incorrectQuestions = attempt.answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({
      questionId: a.questionId,
      questionText: a.question.text,
      options: a.question.options,
      yourAnswer: a.selectedIndex,
      correctAnswer: a.question.correctIndex,
      explanation: a.question.explanation,
    }));

  return {
    attemptId: attempt.id,
    score: attempt.score,
    totalQ: attempt.totalQ,
    correct: attempt.correct,
    passed: attempt.passed,
    incorrectQuestions,
    createdAt: attempt.createdAt,
  };
}

export async function getUserAttempts(userId: string, query: PaginationQuery) {
  const { page, limit, skip } = parsePagination(query);

  const [total, data] = await Promise.all([
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.quizAttempt.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        lesson: { select: { id: true, title: true, moduleId: true } },
      },
    }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
}

export async function getAttemptById(id: string, userId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id },
    include: {
      answers: {
        include: {
          question: {
            select: {
              id: true,
              text: true,
              options: true,
              correctIndex: true,
              explanation: true,
              order: true,
            },
          },
        },
      },
      lesson: { select: { id: true, title: true } },
    },
  });

  if (!attempt) throw new Error("Attempt not found");
  if (attempt.userId !== userId) throw new Error("Access denied");

  return attempt;
}
