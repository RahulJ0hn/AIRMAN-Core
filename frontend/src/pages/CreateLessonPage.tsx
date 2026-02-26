import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2, FileText, HelpCircle, CheckCircle } from "lucide-react";
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

  const inputCls = `w-full h-10 rounded-lg bg-input border border-border px-3 text-sm
    text-foreground placeholder:text-muted-foreground/50
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
    transition-all duration-150`;

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-amber-500/4 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-2xl">

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                     hover:text-foreground mb-8 transition-colors animate-fade-up"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* ── Header ── */}
        <div className="mb-8 animate-fade-up-1">
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center
                            ${type === "MCQ_QUIZ"
                              ? "bg-amber-500/10 border border-amber-500/20"
                              : "bg-sky-500/10 border border-sky-500/20"}`}>
              {type === "MCQ_QUIZ"
                ? <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                : <FileText className="h-3.5 w-3.5 text-sky-400" />}
            </div>
            <span className={`text-xs font-bold tracking-widest uppercase
                              ${type === "MCQ_QUIZ" ? "text-amber-400" : "text-sky-400"}`}>
              New Lesson
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold">Create Lesson</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Add a text lesson or MCQ quiz to this module.
          </p>
        </div>

        <div className="horizon mb-8 animate-fade-up-2" />

        <div className="space-y-5 animate-fade-up-2">

          {/* ── Title ── */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-1.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Lesson Title
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Pre-Flight Checklist Fundamentals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* ── Type selector ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Lesson Type
            </p>
            <div className="flex gap-3">
              {(["TEXT", "MCQ_QUIZ"] as const).map((t) => {
                const active = type === t;
                const isQuiz = t === "MCQ_QUIZ";
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2.5 flex-1 px-4 py-3 rounded-lg border text-sm font-medium
                                transition-all duration-150
                                ${active
                                  ? isQuiz
                                    ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                                    : "bg-sky-500/10 border-sky-500/40 text-sky-300"
                                  : "border-border text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md
                                    ${active
                                      ? isQuiz
                                        ? "bg-amber-500/20 border border-amber-500/40"
                                        : "bg-sky-500/20 border border-sky-500/40"
                                      : "bg-muted border border-border"}`}>
                      {isQuiz
                        ? <HelpCircle className={`h-4 w-4 ${active ? "text-amber-400" : "text-muted-foreground"}`} />
                        : <FileText className={`h-4 w-4 ${active ? "text-sky-400" : "text-muted-foreground"}`} />}
                    </div>
                    {t === "TEXT" ? "Text Lesson" : "MCQ Quiz"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TEXT content ── */}
          {type === "TEXT" && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Content
              </label>
              <textarea
                className="w-full min-h-[200px] rounded-lg bg-input border border-border px-3 py-2.5 text-sm
                           text-foreground placeholder:text-muted-foreground/50 resize-y
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                           transition-all duration-150 leading-relaxed"
                placeholder="Lesson content — plain text or markdown…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {/* ── MCQ questions ── */}
          {type === "MCQ_QUIZ" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Questions ({questions.length})
                </p>
                <button
                  type="button"
                  onClick={() => setQuestions((p) => [...p, emptyQuestion()])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                             border border-border text-muted-foreground
                             hover:text-foreground hover:border-primary/40 transition-all duration-150"
                >
                  <Plus className="h-3 w-3" /> Add Question
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div key={qIdx} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Question header */}
                  <div className="px-5 pt-4 pb-3 flex items-start gap-3 border-b border-border/50">
                    <span className="font-display text-sm font-bold text-muted-foreground shrink-0 mt-2.5">
                      Q{qIdx + 1}.
                    </span>
                    <input
                      className={`${inputCls} flex-1`}
                      placeholder="Enter the question text…"
                      value={q.text}
                      onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                    />
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setQuestions((p) => p.filter((_, i) => i !== qIdx))}
                        className="flex items-center justify-center h-10 w-10 rounded-lg shrink-0
                                   text-muted-foreground hover:text-red-400 hover:bg-red-500/10
                                   transition-all duration-150"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    {/* Options grid */}
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2.5">
                        Answer Options — select correct answer
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all duration-150 cursor-pointer
                                          ${isCorrect
                                            ? "border-emerald-500/40 bg-emerald-500/8"
                                            : "border-border hover:border-white/20"}`}
                              onClick={() => updateQuestion(qIdx, "correctIndex", optIdx)}
                            >
                              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold
                                              transition-colors
                                              ${isCorrect
                                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                                : "bg-muted border border-border text-muted-foreground"}`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <input
                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40
                                           focus:outline-none min-w-0"
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateOption(qIdx, optIdx, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {isCorrect && (
                                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        Click a row to mark it as the correct answer
                      </p>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                        Explanation <span className="normal-case font-normal tracking-normal">(optional)</span>
                      </label>
                      <input
                        className={inputCls}
                        placeholder="Shown to students who answer incorrectly…"
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold
                       hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 amber-glow-sm"
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Creating…" : "Create Lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}
