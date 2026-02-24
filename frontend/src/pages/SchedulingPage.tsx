import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { schedulingService } from "@/services/scheduling.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import type { Booking, BookingStatus, Availability } from "@/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  REQUESTED: { label: "Requested", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800 border-green-300" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-800 border-blue-300" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-300" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SchedulingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [showAvailForm, setShowAvailForm] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [availForm, setAvailForm] = useState({ startTime: "", endTime: "" });
  const [bookForm, setBookForm] = useState({
    instructorId: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent = user?.role === "STUDENT";
  const isAdmin = user?.role === "ADMIN";

  // Calendar data — students see the selected instructor's calendar
  const calendarInstructorId = isInstructor || isAdmin ? user?.id : (bookForm.instructorId || undefined);
  const { data: calendar, isLoading: calLoading } = useQuery({
    queryKey: ["calendar", calendarInstructorId, weekStart.toISOString()],
    queryFn: () =>
      schedulingService.weeklyCalendar(
        calendarInstructorId,
        weekStart.toISOString()
      ),
  });

  // Bookings list
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => schedulingService.listBookings({ page: 1, limit: 20 }),
  });

  // Availabilities — fetched for students to populate the instructor dropdown
  const { data: availabilities } = useQuery({
    queryKey: ["availabilities"],
    queryFn: () => schedulingService.listAvailabilities(),
    enabled: isStudent,
  });

  // Derive unique instructor options from available slots
  const instructorOptions = useMemo(() => {
    if (!availabilities) return [];
    const map = new Map<string, string>();
    availabilities.forEach((a) => map.set(a.instructor.id, a.instructor.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [availabilities]);

  // Mutations
  const createAvailMutation = useMutation({
    mutationFn: (data: { startTime: string; endTime: string }) =>
      schedulingService.createAvailability(data),
    onSuccess: () => {
      toast({ title: "Availability slot created" });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setShowAvailForm(false);
      setAvailForm({ startTime: "", endTime: "" });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const createBookMutation = useMutation({
    mutationFn: (data: typeof bookForm) =>
      schedulingService.createBooking(data),
    onSuccess: () => {
      toast({ title: "Booking requested successfully" });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setShowBookForm(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast({ title: "Conflict Detected", description: msg, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      schedulingService.updateBookingStatus(id, status),
    onSuccess: () => {
      toast({ title: "Booking updated" });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (day: Date) => {
    const dayAvail = (calendar?.availabilities ?? []).filter((a: Availability) =>
      isSameDay(new Date(a.startTime), day)
    );
    const dayBookings = (calendar?.bookings ?? []).filter((b: Booking) =>
      isSameDay(new Date(b.startTime), day)
    );
    return { availabilities: dayAvail, bookings: dayBookings };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-700" />
            Flight Scheduling
          </h1>
          <p className="text-muted-foreground mt-1">
            {isInstructor ? "Manage your availability and bookings" : "Book a session with an instructor"}
          </p>
        </div>
        <div className="flex gap-2">
          {isInstructor && (
            <Button size="sm" variant="outline" onClick={() => setShowAvailForm(!showAvailForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add Availability
            </Button>
          )}
          {isStudent && (
            <Button size="sm" onClick={() => setShowBookForm(!showBookForm)}>
              <Plus className="h-4 w-4 mr-1" /> Book Session
            </Button>
          )}
        </div>
      </div>

      {/* Add Availability Form */}
      {isInstructor && showAvailForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Add Availability Slot</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={availForm.startTime}
                  onChange={(e) => setAvailForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={availForm.endTime}
                  onChange={(e) => setAvailForm((p) => ({ ...p, endTime: e.target.value }))}
                />
              </div>
              <Button
                onClick={() => createAvailMutation.mutate({
                  startTime: new Date(availForm.startTime).toISOString(),
                  endTime: new Date(availForm.endTime).toISOString(),
                })}
                disabled={!availForm.startTime || !availForm.endTime || createAvailMutation.isPending}
              >
                {createAvailMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create Slot
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Book Session Form */}
      {isStudent && showBookForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Request a Booking</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Instructor</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={bookForm.instructorId}
                  onChange={(e) => setBookForm((p) => ({ ...p, instructorId: e.target.value }))}
                >
                  <option value="">Select an instructor…</option>
                  {instructorOptions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="e.g. Solo flight prep"
                  value={bookForm.notes}
                  onChange={(e) => setBookForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={bookForm.startTime}
                  onChange={(e) => setBookForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={bookForm.endTime}
                  onChange={(e) => setBookForm((p) => ({ ...p, endTime: e.target.value }))}
                />
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={() => createBookMutation.mutate({
                ...bookForm,
                startTime: new Date(bookForm.startTime).toISOString(),
                endTime: new Date(bookForm.endTime).toISOString(),
              })}
              disabled={!bookForm.instructorId || !bookForm.startTime || !bookForm.endTime || createBookMutation.isPending}
            >
              {createBookMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Request Booking
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Weekly Calendar ── */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Week of {format(weekStart, "MMMM d, yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => subWeeks(w, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {calLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Loading calendar...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Day headers */}
              {days.map((day, i) => (
                <div key={i} className="text-center font-semibold text-muted-foreground py-2">
                  <div>{DAYS[i]}</div>
                  <div className={`text-base ${isSameDay(day, new Date()) ? "text-blue-700 font-bold" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
              {/* Day cells */}
              {days.map((day, i) => {
                const { availabilities: dayAvail, bookings: dayBookings } = getEventsForDay(day);
                return (
                  <div
                    key={i}
                    className={`min-h-[100px] p-1 rounded border text-xs space-y-1 ${
                      isSameDay(day, new Date()) ? "bg-blue-50 border-blue-200" : "border-border"
                    }`}
                  >
                    {dayAvail.map((a: Availability) => (
                      <div key={a.id} className="bg-green-100 border border-green-300 rounded p-1 text-green-800">
                        <div className="font-medium">Available</div>
                        <div>{format(new Date(a.startTime), "HH:mm")}–{format(new Date(a.endTime), "HH:mm")}</div>
                      </div>
                    ))}
                    {dayBookings.map((b: Booking) => (
                      <div key={b.id} className={`rounded p-1 border ${STATUS_CONFIG[b.status].color}`}>
                        <div className="font-medium">{b.student.name}</div>
                        <div>{format(new Date(b.startTime), "HH:mm")}–{format(new Date(b.endTime), "HH:mm")}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {isInstructor ? "Incoming Booking Requests" : "My Bookings"}
        </h2>
        {bookingsLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded" />)}
          </div>
        ) : bookings?.data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No bookings found.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings?.data.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-medium">
                        {isStudent ? booking.instructor.name : booking.student.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.startTime), "MMM d, yyyy HH:mm")} –{" "}
                        {format(new Date(booking.endTime), "HH:mm")}
                      </div>
                      {booking.notes && (
                        <div className="text-xs text-muted-foreground mt-1">"{booking.notes}"</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_CONFIG[booking.status].color}`}>
                        {STATUS_CONFIG[booking.status].label}
                      </span>

                      {/* Instructor actions */}
                      {isInstructor && booking.status === "REQUESTED" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500 text-green-700 hover:bg-green-50"
                            onClick={() => statusMutation.mutate({ id: booking.id, status: "APPROVED" })}
                            disabled={statusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-700 hover:bg-red-50"
                            onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                            disabled={statusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Decline
                          </Button>
                        </>
                      )}
                      {isInstructor && booking.status === "APPROVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => statusMutation.mutate({ id: booking.id, status: "COMPLETED" })}
                          disabled={statusMutation.isPending}
                        >
                          Mark Completed
                        </Button>
                      )}

                      {/* Student cancel */}
                      {isStudent && ["REQUESTED", "APPROVED"].includes(booking.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-700 hover:bg-red-50"
                          onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                          disabled={statusMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
