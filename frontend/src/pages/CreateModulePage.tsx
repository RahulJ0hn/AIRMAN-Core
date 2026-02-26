import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Layers, Loader2 } from "lucide-react";
import { courseService } from "@/services/course.service";
import { toast } from "@/hooks/useToast";

export function CreateModulePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const mutation = useMutation({
    mutationFn: () => courseService.createModule(courseId!, { title }),
    onSuccess: () => {
      toast({ title: "Module created" });
      // Invalidate the course cache so CourseDetailPage re-fetches and shows the new module
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      navigate(`/courses/${courseId}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create module";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full bg-amber-500/4 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-xl">

        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                     hover:text-foreground mb-8 transition-colors animate-fade-up"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Course
        </Link>

        <div className="mb-8 animate-fade-up-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20
                            flex items-center justify-center">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <span className="text-xs text-sky-400 font-bold tracking-widest uppercase">
              New Module
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold">Create Module</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Add a new module to organize lessons within this course.
          </p>
        </div>

        <div className="horizon mb-8 animate-fade-up-2" />

        <div className="rounded-xl border border-border bg-card p-6 space-y-5 animate-fade-up-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Module Title
            </label>
            <input
              className="w-full h-11 rounded-lg bg-input border border-border px-4 text-sm
                         text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                         transition-all duration-150"
              placeholder="Module 1: Fundamentals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) mutation.mutate(); }}
            />
          </div>

          <button
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
                       hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 amber-glow-sm"
            onClick={() => mutation.mutate()}
            disabled={!title.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Creating…" : "Create Module"}
          </button>
        </div>
      </div>
    </div>
  );
}
