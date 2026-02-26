import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Trophy, Loader2 } from "lucide-react";
import { courseService } from "@/services/course.service";
import { quizService } from "@/services/quiz.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import type { QuizAttempt } from "@/types";

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult]   = useState<QuizAttempt | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => courseService.getLesson(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      quizService.submitAttempt(
        id!,
        Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }))
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
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || "Submission failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleAnswer = (questionId: string, idx: number) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: idx }));
  };

  const allAnswered = lesson?.questions?.every((q) => answers[q.id] !== undefined);
  const answeredCount = Object.keys(answers).length;
  const totalQ = lesson?.questions?.length ?? 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="animate-pulse space-y-5">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-2/3" />
          {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!lesson) return (
    <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
      Lesson not found.
    </div>
  );

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-64 h-64 rounded-full bg-sky-500/4 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-3xl">

        {/* ── Breadcrumb ── */}
        <Link to="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                         hover:text-foreground mb-8 transition-colors animate-fade-up">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>

        {/* ── Lesson header ── */}
        <div className="mb-8 animate-fade-up-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold tracking-widest uppercase border rounded px-2 py-0.5
                              ${lesson.type === "MCQ_QUIZ"
                                ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                : "text-sky-400 border-sky-500/30 bg-sky-500/10"}`}>
              {lesson.type === "MCQ_QUIZ" ? "Quiz" : "Text Lesson"}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{lesson.title}</h1>
        </div>

        <div className="horizon mb-8 animate-fade-up-2" />

        {/* ── TEXT LESSON ── */}
        {lesson.type === "TEXT" && (
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 animate-fade-up-2">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {lesson.content || "No content available."}
            </pre>
          </div>
        )}

        {/* ── MCQ QUIZ ── */}
        {lesson.type === "MCQ_QUIZ" && (
          <div className="space-y-5 animate-fade-up-2">

            {/* Progress bar (pre-submit) */}
            {!result && totalQ > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-mono">{answeredCount}/{totalQ} answered</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${(answeredCount / totalQ) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Score banner */}
            {result && (
              <div className={`rounded-xl border-2 p-5 flex items-center gap-5
                               ${result.passed
                                 ? "border-emerald-500/40 bg-emerald-500/8"
                                 : "border-red-500/40 bg-red-500/8"}`}>
                <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0
                                  ${result.passed ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                  <Trophy className={`h-7 w-7 ${result.passed ? "text-emerald-400" : "text-red-400"}`} />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">
                    {result.passed ? "Mission Complete!" : "Keep Training"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Score:{" "}
                    <span className={`font-bold ${result.passed ? "text-emerald-400" : "text-red-400"}`}>
                      {result.score.toFixed(1)}%
                    </span>
                    {" "}— {result.correct}/{result.totalQ} correct
                  </p>
                </div>
              </div>
            )}

            {/* Questions */}
            {lesson.questions?.map((question, qIdx) => {
              const userAnswer = answers[question.id];
              const isCorrect  = result && userAnswer === question.correctIndex;

              return (
                <div
                  key={question.id}
                  className={`rounded-xl border bg-card overflow-hidden transition-all duration-300
                               ${result
                                 ? isCorrect
                                   ? "border-emerald-500/30"
                                   : "border-red-500/30"
                                 : "border-border"}`}
                >
                  {/* Question header */}
                  <div className="px-5 pt-5 pb-4 flex items-start gap-3">
                    <span className="font-display text-sm font-bold text-muted-foreground shrink-0 mt-0.5">
                      Q{qIdx + 1}.
                    </span>
                    <p className="font-semibold text-foreground leading-snug flex-1">{question.text}</p>
                    {result && (
                      isCorrect
                        ? <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                        : <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    )}
                  </div>

                  {/* Options */}
                  <div className="px-5 pb-5 space-y-2">
                    {(question.options as string[]).map((opt, optIdx) => {
                      const isSelected     = userAnswer === optIdx;
                      const isCorrectOpt   = result && optIdx === question.correctIndex;
                      const isWrongSelected= result && isSelected && !isCorrect;

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswer(question.id, optIdx)}
                          disabled={!!result}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm
                                      transition-all duration-150 flex items-center gap-3
                                      ${isCorrectOpt
                                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                                        : isWrongSelected
                                        ? "bg-red-500/10 border-red-500/40 text-red-300"
                                        : isSelected
                                        ? "bg-primary/10 border-primary/50 text-primary"
                                        : "border-border hover:border-white/20 hover:bg-white/[0.03]"
                                      }
                                      disabled:cursor-default`}
                        >
                          <span className={`h-6 w-6 rounded-md border text-xs font-bold shrink-0
                                            flex items-center justify-center transition-colors
                                            ${isCorrectOpt
                                              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                                              : isWrongSelected
                                              ? "border-red-500/50 bg-red-500/20 text-red-400"
                                              : isSelected
                                              ? "border-primary bg-primary/20 text-primary"
                                              : "border-white/10 text-muted-foreground"}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          {opt}
                        </button>
                      );
                    })}

                    {/* Explanation */}
                    {result && !isCorrect && question.explanation && (
                      <div className="flex items-start gap-2.5 mt-3 p-3 rounded-lg
                                      bg-amber-500/8 border border-amber-500/20 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-amber-200/80 leading-relaxed">
                          <strong className="text-amber-400">Explanation: </strong>
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Submit / Retry */}
            {!result && user?.role === "STUDENT" && (
              <button
                onClick={() => submitMutation.mutate()}
                disabled={!allAnswered || submitMutation.isPending}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold
                           hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 amber-glow-sm"
              >
                {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitMutation.isPending ? "Submitting…" : `Submit Quiz (${answeredCount}/${totalQ})`}
              </button>
            )}

            {result && (
              <button
                onClick={() => { setResult(null); setAnswers({}); }}
                className="w-full h-12 rounded-xl border border-border bg-card text-sm font-medium
                           text-muted-foreground hover:text-foreground hover:border-white/20
                           transition-all duration-150"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
