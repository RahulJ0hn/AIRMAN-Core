import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courseService } from "@/services/course.service";
import { quizService } from "@/services/quiz.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import type { QuizAttempt } from "@/types";

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => courseService.getLesson(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      quizService.submitAttempt(
        id!,
        Object.entries(answers).map(([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        }))
      ),
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: data.passed ? "Quiz Passed!" : "Quiz Submitted",
        description: `Score: ${data.score.toFixed(1)}%`,
        variant: data.passed ? "default" : "destructive",
      });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Submission failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleAnswer = (questionId: string, idx: number) => {
    if (result) return; // Locked after submission
    setAnswers((prev) => ({ ...prev, [questionId]: idx }));
  };

  const allAnswered = lesson?.questions?.every((q) => answers[q.id] !== undefined);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!lesson) return <div className="container mx-auto px-4 py-8">Lesson not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link to="/courses" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <Badge variant={lesson.type === "MCQ_QUIZ" ? "warning" : "secondary"} className="mt-1">
            {lesson.type === "MCQ_QUIZ" ? "Quiz" : "Text Lesson"}
          </Badge>
        </div>
      </div>

      {/* TEXT LESSON */}
      {lesson.type === "TEXT" && (
        <Card>
          <CardContent className="pt-6 prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {lesson.content || "No content available."}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* MCQ QUIZ */}
      {lesson.type === "MCQ_QUIZ" && (
        <div className="space-y-4">
          {/* Score banner */}
          {result && (
            <Card className={`border-2 ${result.passed ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50"}`}>
              <CardContent className="py-4 flex items-center gap-4">
                <Trophy className={`h-8 w-8 ${result.passed ? "text-green-600" : "text-red-500"}`} />
                <div>
                  <p className="font-bold text-lg">
                    {result.passed ? "Passed! ✈️" : "Not quite — try again!"}
                  </p>
                  <p className="text-sm">
                    Score: <strong>{result.score.toFixed(1)}%</strong> — {result.correct}/{result.totalQ} correct
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          {lesson.questions?.map((question, qIdx) => {
            const userAnswer = answers[question.id];
            const isCorrect = result && userAnswer === question.correctIndex;

            return (
              <Card key={question.id} className={result ? (isCorrect ? "border-green-400" : "border-red-400") : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-start gap-2">
                    <span className="text-muted-foreground shrink-0">Q{qIdx + 1}.</span>
                    <span>{question.text}</span>
                    {result && (
                      isCorrect
                        ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0 ml-auto" />
                        : <XCircle className="h-5 w-5 text-red-500 shrink-0 ml-auto" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(question.options as string[]).map((opt, optIdx) => {
                    const isSelected = userAnswer === optIdx;
                    const isCorrectOpt = result && optIdx === question.correctIndex;
                    const isWrongSelected = result && isSelected && !isCorrect;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswer(question.id, optIdx)}
                        disabled={!!result}
                        className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-colors ${
                          isCorrectOpt
                            ? "bg-green-100 border-green-500 text-green-800"
                            : isWrongSelected
                            ? "bg-red-100 border-red-500 text-red-800"
                            : isSelected
                            ? "bg-primary/10 border-primary text-primary"
                            : "hover:bg-muted border-input"
                        }`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                      </button>
                    );
                  })}

                  {/* Explanation for wrong answers */}
                  {result && !isCorrect && question.explanation && (
                    <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-amber-800"><strong>Explanation:</strong> {question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Submit / Retry */}
          {!result && user?.role === "STUDENT" && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => submitMutation.mutate()}
              disabled={!allAnswered || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}

          {result && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setResult(null); setAnswers({}); }}
            >
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
