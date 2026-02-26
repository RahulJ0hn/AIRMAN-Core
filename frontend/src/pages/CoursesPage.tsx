import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, Search, ChevronLeft, ChevronRight, Layers, Clock } from "lucide-react";
import { courseService } from "@/services/course.service";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

// Deterministic accent colour per course title
const ACCENTS = [
  { bg: "from-amber-500/20 to-amber-500/5",  border: "border-amber-500/20",  text: "text-amber-400",  dot: "bg-amber-400"  },
  { bg: "from-sky-500/20 to-sky-500/5",      border: "border-sky-500/20",    text: "text-sky-400",    dot: "bg-sky-400"    },
  { bg: "from-violet-500/20 to-violet-500/5",border: "border-violet-500/20", text: "text-violet-400", dot: "bg-violet-400" },
  { bg: "from-emerald-500/20 to-emerald-500/5",border:"border-emerald-500/20",text:"text-emerald-400",dot:"bg-emerald-400"  },
  { bg: "from-rose-500/20 to-rose-500/5",    border: "border-rose-500/20",   text: "text-rose-400",   dot: "bg-rose-400"   },
];
const accent = (id: string) => ACCENTS[id.charCodeAt(0) % ACCENTS.length];

export function CoursesPage() {
  const { user } = useAuth();
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage]               = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["courses", page, search],
    queryFn: () => courseService.listCourses({ page, limit: 9, search: search || undefined }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const canCreate = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-80 h-80 rounded-full bg-amber-500/4 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20
                              flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-xs text-amber-400 font-bold tracking-widest uppercase">
                Maverick Module
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold">Flight Courses</h1>
            <p className="text-muted-foreground mt-1">
              Aviation training curriculum — structured, tested, certified.
            </p>
          </div>

          {canCreate && (
            <Link
              to="/courses/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                         bg-primary text-primary-foreground text-sm font-semibold
                         hover:bg-primary/90 active:scale-[0.98] transition-all amber-glow-sm
                         shrink-0"
            >
              <Plus className="h-4 w-4" />
              New Course
            </Link>
          )}
        </div>

        {/* ── Search ── */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-md animate-fade-up-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search courses…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-input border border-border text-sm
                         text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                         transition-all duration-150"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 rounded-lg bg-white/[0.06] border border-white/[0.08]
                       text-sm text-muted-foreground hover:text-foreground hover:bg-white/10
                       transition-all duration-150"
          >
            Search
          </button>
        </form>

        {/* ── Course grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                <div className="h-28 rounded-t-xl bg-muted/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-destructive">
            Failed to load courses. Please try again.
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No courses found{search ? ` for "${search}"` : ""}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up-2">
            {data?.data.map((course) => {
              const a = accent(course.id);
              return (
                <Link key={course.id} to={`/courses/${course.id}`} className="group">
                  <div className={`flex flex-col h-full rounded-xl border bg-card overflow-hidden
                                   transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                                   ${a.border} group-hover:shadow-${a.dot.replace("bg-","")+"/10"}`}>
                    {/* Colour header strip */}
                    <div className={`h-24 bg-gradient-to-br ${a.bg} relative overflow-hidden flex items-end p-4`}>
                      <div className="absolute top-4 right-4 opacity-20">
                        <BookOpen className="h-12 w-12" />
                      </div>
                      <span className={`text-[10px] font-bold tracking-widest uppercase
                                        border rounded px-2 py-0.5 ${a.text} border-current/30 bg-black/20`}>
                        Course
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display text-lg font-semibold line-clamp-2 mb-2
                                     group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                          {course.description}
                        </p>
                      )}

                      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className={`h-4 w-4 rounded-full ${a.dot} opacity-80 flex items-center justify-center`}>
                            <span className="text-[8px] font-bold text-black">
                              {course.createdBy.name.charAt(0)}
                            </span>
                          </div>
                          {course.createdBy.name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          {course._count?.modules ?? 0} modules
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        {formatDate(course.createdAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!data.pagination.hasPrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
                         border border-border bg-card text-muted-foreground
                         hover:text-foreground hover:border-primary/40
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm text-muted-foreground font-mono">
              {data.pagination.page} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.pagination.hasNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
                         border border-border bg-card text-muted-foreground
                         hover:text-foreground hover:border-primary/40
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
