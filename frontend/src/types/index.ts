export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type BookingStatus = "REQUESTED" | "APPROVED" | "COMPLETED" | "CANCELLED";
export type LessonType = "TEXT" | "MCQ_QUIZ";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  approved: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  createdById: string;
  createdBy: Pick<User, "id" | "name" | "email">;
  createdAt: string;
  updatedAt: string;
  _count?: { modules: number };
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt: string;
  lessons?: Lesson[];
  _count?: { lessons: number };
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  order: number;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  order: number;
  content?: string;
  moduleId: string;
  questions?: Question[];
  _count?: { questions: number };
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  score: number;
  totalQ: number;
  correct: number;
  passed: boolean;
  createdAt: string;
  lesson?: Pick<Lesson, "id" | "title">;
  incorrectQuestions?: IncorrectQuestion[];
}

export interface IncorrectQuestion {
  questionId: string;
  questionText: string;
  options: string[];
  yourAnswer: number;
  correctAnswer: number;
  explanation?: string;
}

export interface Availability {
  id: string;
  instructorId: string;
  instructor: Pick<User, "id" | "name" | "email">;
  startTime: string;
  endTime: string;
  createdAt: string;
  _count?: { bookings: number };
}

export interface Booking {
  id: string;
  studentId: string;
  instructorId: string;
  availabilityId?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  student: Pick<User, "id" | "name" | "email">;
  instructor: Pick<User, "id" | "name" | "email">;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
