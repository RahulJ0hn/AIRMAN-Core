import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseService } from "@/services/course.service";
import { toast } from "@/hooks/useToast";

type QuestionDraft = {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

const emptyQuestion = (): QuestionDraft => ({
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

export function CreateLessonPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"TEXT" | "MCQ_QUIZ">("TEXT");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);

  const mutation = useMutation({
    mutationFn: () =>
      courseService.createLesson(moduleId!, {
        title,
        type,
        content: type === "TEXT" ? content : undefined,
        questions:
          type === "MCQ_QUIZ"
            ? questions.map((q, i) => ({
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation || undefined,
                order: i,
              }))
            : undefined,
      }),
    onSuccess: (lesson) => {
      toast({ title: "Lesson created" });
      navigate(`/lessons/${lesson.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create lesson";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const updateQuestion = (idx: number, field: keyof Omit<QuestionDraft, "options">, value: string | number) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );
  };

  const isValid =
    !!title.trim() &&
    (type === "TEXT"
      ? !!content.trim()
      : questions.length > 0 && questions.every((q) => q.text.trim() && q.options.every((o) => o.trim())));

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card>
        <CardHeader><CardTitle>New Lesson</CardTitle></CardHeader>
        <CardContent className="space-y-5">

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Lesson title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Type toggle */}
          <div className="space-y-1">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["TEXT", "MCQ_QUIZ"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={type === t ? "default" : "outline"}
                  onClick={() => setType(t)}
                >
                  {t === "TEXT" ? "Text Lesson" : "MCQ Quiz"}
                </Button>
              ))}
            </div>
          </div>

          {/* TEXT content */}
          {type === "TEXT" && (
            <div className="space-y-1">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                placeholder="Lesson content (supports plain text / markdown)…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {/* MCQ questions */}
          {type === "MCQ_QUIZ" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setQuestions((p) => [...p, emptyQuestion()])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Question
                </Button>
              </div>

              {questions.map((q, qIdx) => (
                <Card key={qIdx} className="bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    {/* Question text */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Label>Q{qIdx + 1}. Question text</Label>
                        <Input
                          placeholder="Enter the question"
                          value={q.text}
                          onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                        />
                      </div>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive mt-6 shrink-0"
                          onClick={() => setQuestions((p) => p.filter((_, i) => i !== qIdx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => updateQuestion(qIdx, "correctIndex", optIdx)}
                            className="shrink-0 accent-primary"
                            title="Mark as correct answer"
                          />
                          <Input
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>

                    {/* Explanation */}
                    <div className="space-y-1">
                      <Label>Explanation (optional)</Label>
                      <Input
                        placeholder="Shown to students who answer incorrectly"
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Lesson
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
