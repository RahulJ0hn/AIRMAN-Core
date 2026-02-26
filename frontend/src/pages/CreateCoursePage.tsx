import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { courseService } from "@/services/course.service";
import { toast } from "@/hooks/useToast";

export function CreateCoursePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "" });

  const mutation = useMutation({
    mutationFn: () => courseService.createCourse(form),
    onSuccess: (course) => {
      toast({ title: "Course created" });
      // Invalidate the courses list so CoursesPage shows the new course if navigated back
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate(`/courses/${course.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create course";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const inputCls = `w-full h-11 rounded-lg bg-input border border-border px-4 text-sm
    text-foreground placeholder:text-muted-foreground/50
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
    transition-all duration-150`;

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-64 h-64 rounded-full bg-amber-500/4 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-xl">

        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                     hover:text-foreground mb-8 transition-colors animate-fade-up"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>

        <div className="mb-8 animate-fade-up-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20
                            flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-xs text-amber-400 font-bold tracking-widest uppercase">
              New Course
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold">Create Course</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build a new aviation training course with modules and lessons.
          </p>
        </div>

        <div className="horizon mb-8 animate-fade-up-2" />

        <div className="rounded-xl border border-border bg-card p-6 space-y-5 animate-fade-up-2">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Course Title
            </label>
            <input
              className={inputCls}
              placeholder="Introduction to Aviation"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Description <span className="text-muted-foreground/50 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              className={`${inputCls} h-auto min-h-[100px] py-3 resize-none`}
              placeholder="A brief overview of what students will learn…"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <button
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
                       hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 amber-glow-sm"
            onClick={() => mutation.mutate()}
            disabled={!form.title.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Creating…" : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
}
