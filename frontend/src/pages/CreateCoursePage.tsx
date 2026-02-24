import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseService } from "@/services/course.service";
import { toast } from "@/hooks/useToast";

export function CreateCoursePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "" });

  const mutation = useMutation({
    mutationFn: () => courseService.createCourse(form),
    onSuccess: (course) => {
      toast({ title: "Course created" });
      navigate(`/courses/${course.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create course";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <Link to="/courses" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>
      <Card>
        <CardHeader><CardTitle>New Course</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Introduction to Aviation"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc">Description (optional)</Label>
            <Input
              id="desc"
              placeholder="A brief overview of the course..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!form.title.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Course
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
