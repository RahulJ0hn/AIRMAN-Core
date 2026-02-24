import { api } from "./api";
import { ApiResponse, Course, Module, Lesson, PaginatedResponse } from "../types";

export const courseService = {
  async listCourses(params?: { page?: number; limit?: number; search?: string }) {
    const res = await api.get<ApiResponse<PaginatedResponse<Course>>>("/courses", { params });
    return res.data.data;
  },

  async getCourse(id: string) {
    const res = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return res.data.data;
  },

  async createCourse(data: { title: string; description?: string }) {
    const res = await api.post<ApiResponse<Course>>("/courses", data);
    return res.data.data;
  },

  async updateCourse(id: string, data: { title?: string; description?: string }) {
    const res = await api.put<ApiResponse<Course>>(`/courses/${id}`, data);
    return res.data.data;
  },

  async deleteCourse(id: string) {
    await api.delete(`/courses/${id}`);
  },

  // Modules
  async listModules(courseId: string) {
    const res = await api.get<ApiResponse<Module[]>>(`/courses/${courseId}/modules`);
    return res.data.data;
  },

  async createModule(courseId: string, data: { title: string; order?: number }) {
    const res = await api.post<ApiResponse<Module>>(`/courses/${courseId}/modules`, data);
    return res.data.data;
  },

  async updateModule(id: string, data: { title?: string; order?: number }) {
    const res = await api.put<ApiResponse<Module>>(`/modules/${id}`, data);
    return res.data.data;
  },

  async deleteModule(id: string) {
    await api.delete(`/modules/${id}`);
  },

  // Lessons
  async listLessons(moduleId: string) {
    const res = await api.get<ApiResponse<Lesson[]>>(`/modules/${moduleId}/lessons`);
    return res.data.data;
  },

  async getLesson(id: string) {
    const res = await api.get<ApiResponse<Lesson>>(`/lessons/${id}`);
    return res.data.data;
  },

  async createLesson(
    moduleId: string,
    data: {
      title: string;
      type: "TEXT" | "MCQ_QUIZ";
      order?: number;
      content?: string;
      questions?: Array<{
        text: string;
        options: string[];
        correctIndex: number;
        explanation?: string;
        order?: number;
      }>;
    }
  ) {
    const res = await api.post<ApiResponse<Lesson>>(`/modules/${moduleId}/lessons`, data);
    return res.data.data;
  },

  async deleteLesson(id: string) {
    await api.delete(`/lessons/${id}`);
  },
};
