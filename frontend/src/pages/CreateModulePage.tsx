import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseService } from "@/services/course.service";
import { toast } from "@/hooks/useToast";

export function CreateModulePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");

  const mutation = useMutation({
    mutationFn: () => courseService.createModule(courseId!, { title }),
    onSuccess: () => {
      toast({ title: "Module created" });
      navigate(`/courses/${courseId}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create module";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <Link to={`/courses/${courseId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>
      <Card>
        <CardHeader><CardTitle>New Module</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              placeholder="Module 1: Fundamentals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!title.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Module
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
