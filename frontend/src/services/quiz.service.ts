import { api } from "./api";
import { ApiResponse, QuizAttempt, PaginatedResponse } from "../types";

export const quizService = {
  async submitAttempt(
    lessonId: string,
    answers: Array<{ questionId: string; selectedIndex: number }>
  ) {
    const res = await api.post<ApiResponse<QuizAttempt>>(`/lessons/${lessonId}/attempt`, { answers });
    return res.data.data;
  },

  async myAttempts(params?: { page?: number; limit?: number }) {
    const res = await api.get<ApiResponse<PaginatedResponse<QuizAttempt>>>("/quiz/attempts", { params });
    return res.data.data;
  },

  async getAttempt(id: string) {
    const res = await api.get<ApiResponse<QuizAttempt>>(`/quiz/attempts/${id}`);
    return res.data.data;
  },
};
