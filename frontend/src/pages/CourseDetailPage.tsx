import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Plus, Trash2, ChevronDown, ChevronRight, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Link to="/courses"><Button variant="outline" className="mt-4">Back to Courses</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <Link to="/courses" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All Courses
      </Link>

      {/* Course Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{course.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Created by <span className="font-medium">{course.createdBy.name}</span>
          </p>
        </div>
        {canManage && user?.role === "ADMIN" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { if (confirm("Delete this course?")) deleteMutation.mutate(); }}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        )}
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Modules ({course.modules?.length ?? 0})
          </h2>
          {canManage && (
            <Link to={`/courses/${id}/modules/new`}>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" /> Add Module
              </Button>
            </Link>
          )}
        </div>

        {course.modules?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No modules yet. {canManage && "Add the first module to get started."}
            </CardContent>
          </Card>
        ) : (
          course.modules?.map((module: Module, idx: number) => (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Module {idx + 1}
                    </span>
                    <CardTitle className="text-base">{module.title}</CardTitle>
                  </div>
                  <Badge variant="outline">{module.lessons?.length ?? 0} lessons</Badge>
                </div>
              </CardHeader>

              {expandedModules.has(module.id) && (
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-2 pl-7">
                    {module.lessons?.map((lesson: Lesson) => (
                      <Link
                        key={lesson.id}
                        to={`/lessons/${lesson.id}`}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors group"
                      >
                        {lesson.type === "MCQ_QUIZ" ? (
                          <HelpCircle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm group-hover:text-primary">{lesson.title}</span>
                        <Badge variant={lesson.type === "MCQ_QUIZ" ? "warning" : "secondary"} className="ml-auto text-xs">
                          {lesson.type === "MCQ_QUIZ" ? "Quiz" : "Text"}
                        </Badge>
                      </Link>
                    ))}

                    {canManage && (
                      <Link to={`/modules/${module.id}/lessons/new`}>
                        <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground mt-1">
                          <Plus className="h-3 w-3" /> Add Lesson
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
