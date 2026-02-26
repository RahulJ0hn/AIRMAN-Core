import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, X } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { schedulingService } from "@/services/scheduling.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import type { Booking, BookingStatus, Availability } from "@/types";

const STATUS_CONFIG: Record<BookingStatus, { label: string; style: string }> = {
  REQUESTED: { label: "Requested", style: "bg-amber-500/15 text-amber-400 border-amber-500/30"   },
  APPROVED:  { label: "Approved",  style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  COMPLETED: { label: "Completed", style: "bg-sky-500/15 text-sky-400 border-sky-500/30"          },
  CANCELLED: { label: "Cancelled", style: "bg-muted text-muted-foreground border-border"           },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const inputCls = `w-full h-10 rounded-lg bg-input border border-border px-3 text-sm
  text-foreground placeholder:text-muted-foreground/50
  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
  transition-all duration-150`;

const labelCls = "block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-1.5";

export function SchedulingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart]     = useState(() => startOfWeek(new Date()));
  const [showAvailForm, setShowAvailForm] = useState(false);
  const [showBookForm,  setShowBookForm]  = useState(false);
  const [availForm, setAvailForm] = useState({ startTime: "", endTime: "" });
  const [bookForm,  setBookForm]  = useState({ instructorId: "", startTime: "", endTime: "", notes: "" });

  const isInstructor = user?.role === "INSTRUCTOR";
  const isStudent    = user?.role === "STUDENT";

  // Calendar data:
  // - Instructor: their own ID → shows their availability + all bookings they have
  // - Student:    selected instructor's ID (for availability overlay while booking); undefined otherwise
  // - Admin:      undefined → no instructor-specific calendar; events come from bookings list
  const calendarInstructorId = isInstructor
    ? user?.id
    : isStudent
    ? (bookForm.instructorId || undefined)
    : undefined;

  const { data: calendar, isLoading: calLoading } = useQuery({
    queryKey: ["calendar", calendarInstructorId, weekStart.toISOString()],
    queryFn: () => schedulingService.weeklyCalendar(calendarInstructorId, weekStart.toISOString()),
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", user?.id],
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
    mutationFn: (data: typeof bookForm) => schedulingService.createBooking(data),
    onSuccess: () => {
      toast({ title: "Booking requested successfully" });
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
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
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });
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
    // Instructors: bookings come from the weekly calendar (instructor-scoped)
    // Students & Admin: bookings come from the bookings list (already scoped to their own bookings)
    const dayBookings = isInstructor
      ? (calendar?.bookings ?? []).filter((b: Booking) => isSameDay(new Date(b.startTime), day))
      : (bookings?.data ?? []).filter((b: Booking) => isSameDay(new Date(b.startTime), day));
    return { availabilities: dayAvail, bookings: dayBookings };
  };

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 rounded-full bg-sky-500/4 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20
                              flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-sky-400" />
              </div>
              <span className="text-xs text-sky-400 font-bold tracking-widest uppercase">Skynet Module</span>
            </div>
            <h1 className="font-display text-4xl font-bold">Flight Scheduling</h1>
            <p className="text-muted-foreground mt-1">
              {isInstructor ? "Manage availability and incoming requests" : "Book a session with a certified instructor"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {isInstructor && (
              <button
                onClick={() => setShowAvailForm(!showAvailForm)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                           border border-sky-500/30 text-sky-400 bg-sky-500/10
                           hover:bg-sky-500/20 transition-all"
              >
                {showAvailForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showAvailForm ? "Close" : "Add Availability"}
              </button>
            )}
            {isStudent && (
              <button
                onClick={() => setShowBookForm(!showBookForm)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                           bg-primary text-primary-foreground hover:bg-primary/90
                           active:scale-[0.98] transition-all amber-glow-sm"
              >
                {showBookForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showBookForm ? "Close" : "Book Session"}
              </button>
            )}
          </div>
        </div>

        {/* ── Add Availability Form ── */}
        {isInstructor && showAvailForm && (
          <div className="rounded-xl border border-sky-500/20 bg-card mb-8 p-6 animate-fade-up">
            <h3 className="font-display text-lg font-semibold mb-5 text-sky-400">
              Add Availability Slot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className={labelCls}>Start Time</label>
                <input type="datetime-local" className={inputCls}
                  value={availForm.startTime}
                  onChange={(e) => setAvailForm((p) => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input type="datetime-local" className={inputCls}
                  value={availForm.endTime}
                  onChange={(e) => setAvailForm((p) => ({ ...p, endTime: e.target.value }))} />
              </div>
              <button
                onClick={() => createAvailMutation.mutate({
                  startTime: new Date(availForm.startTime).toISOString(),
                  endTime: new Date(availForm.endTime).toISOString(),
                })}
                disabled={!availForm.startTime || !availForm.endTime || createAvailMutation.isPending}
                className="h-10 px-5 rounded-lg bg-sky-500 text-white text-sm font-semibold
                           hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 transition-all"
              >
                {createAvailMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Slot
              </button>
            </div>
          </div>
        )}

        {/* ── Book Session Form ── */}
        {isStudent && showBookForm && (
          <div className="rounded-xl border border-amber-500/20 bg-card mb-8 p-6 animate-fade-up">
            <h3 className="font-display text-lg font-semibold mb-5 text-amber-400">
              Request a Booking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Instructor</label>
                <select
                  className={inputCls}
                  value={bookForm.instructorId}
                  onChange={(e) => setBookForm((p) => ({ ...p, instructorId: e.target.value }))}
                >
                  <option value="">Select an instructor…</option>
                  {instructorOptions.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                {instructorOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    No instructors have posted availability yet.
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Notes (optional)</label>
                <input className={inputCls} placeholder="e.g. Solo flight prep"
                  value={bookForm.notes}
                  onChange={(e) => setBookForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Start Time</label>
                <input type="datetime-local" className={inputCls}
                  value={bookForm.startTime}
                  onChange={(e) => setBookForm((p) => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input type="datetime-local" className={inputCls}
                  value={bookForm.endTime}
                  onChange={(e) => setBookForm((p) => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
            <button
              className="mt-5 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold
                         hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2 transition-all amber-glow-sm"
              onClick={() => createBookMutation.mutate({
                ...bookForm,
                startTime: new Date(bookForm.startTime).toISOString(),
                endTime: new Date(bookForm.endTime).toISOString(),
              })}
              disabled={!bookForm.instructorId || !bookForm.startTime || !bookForm.endTime || createBookMutation.isPending}
            >
              {createBookMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Request Booking
            </button>
          </div>
        )}

        {/* ── Weekly Calendar ── */}
        <div className="rounded-xl border border-border bg-card mb-8 overflow-hidden animate-fade-up-1">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-display font-semibold">
                {format(weekStart, "MMMM d")} – {format(addDays(weekStart, 6), "d, yyyy")}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setWeekStart((w) => subWeeks(w, 1))}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center
                           text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center
                           text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {calLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading calendar…
            </div>
          ) : (
            <div className="p-3">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {days.map((day, i) => (
                  <div key={i} className="text-center py-2">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      {DAYS[i]}
                    </p>
                    <p className={`font-display text-lg font-bold mt-0.5
                                   ${isSameDay(day, new Date())
                                     ? "text-amber-400"
                                     : "text-foreground"}`}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  const { availabilities: dayAvail, bookings: dayBookings } = getEventsForDay(day);
                  return (
                    <div
                      key={i}
                      className={`min-h-[90px] p-1 rounded-lg border text-xs space-y-1
                                  ${isSameDay(day, new Date())
                                    ? "border-amber-500/20 bg-amber-500/5"
                                    : "border-border"}`}
                    >
                      {dayAvail.map((a: Availability) => (
                        <div key={a.id}
                             className="rounded-md p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <div className="font-semibold text-[10px] uppercase tracking-wider">Open</div>
                          <div className="font-mono text-[10px]">
                            {format(new Date(a.startTime), "HH:mm")}–{format(new Date(a.endTime), "HH:mm")}
                          </div>
                        </div>
                      ))}
                      {dayBookings.map((b: Booking) => (
                        <div key={b.id}
                             className={`rounded-md p-1.5 border ${STATUS_CONFIG[b.status].style}`}>
                          <div className="font-semibold truncate text-[10px]">
                            {isInstructor ? b.student.name : b.instructor.name}
                          </div>
                          <div className="font-mono text-[10px]">
                            {format(new Date(b.startTime), "HH:mm")}–{format(new Date(b.endTime), "HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Bookings List ── */}
        <div className="animate-fade-up-2">
          <h2 className="font-display text-2xl font-semibold mb-5">
            {isInstructor ? "Incoming Requests" : "My Bookings"}
          </h2>

          {bookingsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : bookings?.data.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
              No bookings found.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings?.data.map((booking) => (
                <div key={booking.id}
                     className="rounded-xl border border-border bg-card px-5 py-4 transition-all
                                hover:border-white/15">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <p className="font-semibold truncate">
                          {isStudent ? booking.instructor.name : booking.student.name}
                        </p>
                        <span className={`shrink-0 border rounded px-2 py-0.5 text-[10px] font-bold
                                          tracking-wider uppercase ${STATUS_CONFIG[booking.status].style}`}>
                          {STATUS_CONFIG[booking.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {format(new Date(booking.startTime), "MMM d, yyyy · HH:mm")} –{" "}
                        {format(new Date(booking.endTime), "HH:mm")}
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-muted-foreground/70 mt-1 italic">
                          "{booking.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isInstructor && booking.status === "REQUESTED" && (
                        <>
                          <button
                            onClick={() => statusMutation.mutate({ id: booking.id, status: "APPROVED" })}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                       border border-emerald-500/30 text-emerald-400 bg-emerald-500/10
                                       hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                            disabled={statusMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                       border border-red-500/30 text-red-400 bg-red-500/10
                                       hover:bg-red-500/20 disabled:opacity-50 transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Decline
                          </button>
                        </>
                      )}
                      {isInstructor && booking.status === "APPROVED" && (
                        <button
                          onClick={() => statusMutation.mutate({ id: booking.id, status: "COMPLETED" })}
                          disabled={statusMutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                     border border-sky-500/30 text-sky-400 bg-sky-500/10
                                     hover:bg-sky-500/20 disabled:opacity-50 transition-all"
                        >
                          Mark Completed
                        </button>
                      )}
                      {isStudent && ["REQUESTED", "APPROVED"].includes(booking.status) && (
                        <button
                          onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                     border border-red-500/30 text-red-400 bg-red-500/10
                                     hover:bg-red-500/20 disabled:opacity-50 transition-all"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
