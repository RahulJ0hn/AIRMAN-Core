import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Plus, Trash2, ChevronDown, ChevronRight, FileText, HelpCircle } from "lucide-react";
import { courseService } from "@/services/course.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import type { Module, Lesson } from "@/types";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  useQueryClient();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => courseService.getCourse(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => courseService.deleteCourse(id!),
    onSuccess: () => {
      toast({ title: "Course deleted" });
      navigate("/courses");
    },
    onError: () => toast({ title: "Error", description: "Failed to delete course", variant: "destructive" }),
  });

  const canManage = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-10 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
          {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Course not found.</p>
        <Link to="/courses">
          <button className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            Back to Courses
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full bg-amber-500/4 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-4xl">

        {/* ── Breadcrumb ── */}
        <Link to="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                         hover:text-foreground mb-8 transition-colors animate-fade-up">
          <ArrowLeft className="h-4 w-4" /> All Courses
        </Link>

        {/* ── Course header ── */}
        <div className="flex items-start justify-between gap-4 mb-10 animate-fade-up-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-bold tracking-widest uppercase">Course</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground leading-relaxed max-w-2xl">{course.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              Authored by{" "}
              <span className="font-medium text-foreground">{course.createdBy.name}</span>
            </p>
          </div>

          {canManage && user?.role === "ADMIN" && (
            <button
              onClick={() => { if (confirm("Delete this course?")) deleteMutation.mutate(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                         text-red-400 border border-red-500/20 hover:bg-red-500/10
                         transition-all shrink-0"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>

        <div className="horizon mb-10 animate-fade-up-2" />

        {/* ── Modules ── */}
        <div className="animate-fade-up-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold">
              Modules
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({course.modules?.length ?? 0})
              </span>
            </h2>
            {canManage && (
              <Link to={`/courses/${id}/modules/new`}>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                                   border border-border text-muted-foreground
                                   hover:text-foreground hover:border-primary/40 transition-all">
                  <Plus className="h-3.5 w-3.5" /> Add Module
                </button>
              </Link>
            )}
          </div>

          {course.modules?.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
              No modules yet.{canManage && " Add the first module to get started."}
            </div>
          ) : (
            <div className="space-y-3">
              {course.modules?.map((module: Module, idx: number) => (
                <div key={module.id}
                     className={`rounded-xl border bg-card overflow-hidden transition-all duration-200
                                 ${expandedModules.has(module.id)
                                   ? "border-amber-500/25"
                                   : "border-border hover:border-white/15"}`}>
                  {/* Module header */}
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                                       text-xs font-bold font-mono transition-colors
                                       ${expandedModules.has(module.id)
                                         ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                         : "bg-muted text-muted-foreground"}`}>
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold mb-0.5">
                          Module {idx + 1}
                        </p>
                        <p className="font-semibold text-foreground">{module.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {module.lessons?.length ?? 0} lessons
                      </span>
                      {expandedModules.has(module.id)
                        ? <ChevronDown className="h-4 w-4 text-amber-400" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Module lessons */}
                  {expandedModules.has(module.id) && (
                    <div className="border-t border-border/60 px-5 py-3 space-y-1">
                      {module.lessons?.map((lesson: Lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/lessons/${lesson.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                                     hover:bg-white/[0.04] transition-colors group"
                        >
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md
                                           ${lesson.type === "MCQ_QUIZ"
                                             ? "bg-amber-500/10 border border-amber-500/20"
                                             : "bg-sky-500/10 border border-sky-500/20"}`}>
                            {lesson.type === "MCQ_QUIZ"
                              ? <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                              : <FileText className="h-3.5 w-3.5 text-sky-400" />}
                          </div>
                          <span className="text-sm text-muted-foreground group-hover:text-foreground
                                           transition-colors flex-1">
                            {lesson.title}
                          </span>
                          <span className={`text-[10px] font-semibold tracking-wider uppercase
                                            border rounded px-1.5 py-0.5
                                            ${lesson.type === "MCQ_QUIZ"
                                              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                              : "text-sky-400 border-sky-500/30 bg-sky-500/10"}`}>
                            {lesson.type === "MCQ_QUIZ" ? "Quiz" : "Text"}
                          </span>
                        </Link>
                      ))}

                      {canManage && (
                        <Link to={`/modules/${module.id}/lessons/new`}>
                          <button className="flex items-center gap-2 px-3 py-2 mt-1 text-xs
                                             text-muted-foreground hover:text-foreground
                                             rounded-lg hover:bg-white/[0.04] transition-colors">
                            <Plus className="h-3 w-3" /> Add Lesson
                          </button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
