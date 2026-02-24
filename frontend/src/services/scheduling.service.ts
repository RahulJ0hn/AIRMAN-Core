import { api } from "./api";
import { ApiResponse, Availability, Booking, BookingStatus, PaginatedResponse } from "../types";

export const schedulingService = {
  // Availability
  async listAvailabilities(instructorId?: string) {
    const res = await api.get<ApiResponse<Availability[]>>("/scheduling/availability", {
      params: instructorId ? { instructorId } : {},
    });
    return res.data.data;
  },

  async createAvailability(data: { startTime: string; endTime: string }) {
    const res = await api.post<ApiResponse<Availability>>("/scheduling/availability", data);
    return res.data.data;
  },

  async deleteAvailability(id: string) {
    await api.delete(`/scheduling/availability/${id}`);
  },

  // Bookings
  async listBookings(params?: { page?: number; limit?: number; status?: BookingStatus }) {
    const res = await api.get<ApiResponse<PaginatedResponse<Booking>>>("/scheduling/bookings", { params });
    return res.data.data;
  },

  async createBooking(data: {
    instructorId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    availabilityId?: string;
  }) {
    const res = await api.post<ApiResponse<Booking>>("/scheduling/bookings", data);
    return res.data.data;
  },

  async updateBookingStatus(id: string, status: BookingStatus) {
    const res = await api.patch<ApiResponse<Booking>>(`/scheduling/bookings/${id}/status`, { status });
    return res.data.data;
  },

  // Calendar
  async weeklyCalendar(instructorId?: string, weekStart?: string) {
    const res = await api.get<ApiResponse<{ availabilities: Availability[]; bookings: Booking[] }>>(
      "/scheduling/calendar",
      { params: { instructorId, weekStart } }
    );
    return res.data.data;
  },
};
