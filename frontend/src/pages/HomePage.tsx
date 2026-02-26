import { Link } from "react-router-dom";
import { BookOpen, Calendar, Plane, Shield, ChevronRight, Zap, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function HomePage() {
  const { user } = useAuth();

  const cards = [
    {
      to: "/courses",
      icon: BookOpen,
      label: "Maverick",
      sublabel: "Learning Module",
      description: user?.role === "INSTRUCTOR"
        ? "Build courses, craft lessons, and design quizzes for your students."
        : "Study structured aviation courses and test your knowledge.",
      cta: user?.role === "INSTRUCTOR" ? "Manage Courses" : "Browse Courses",
      accent: "amber",
      delay: "animate-fade-up-1",
    },
    {
      to: "/scheduling",
      icon: Calendar,
      label: "Skynet",
      sublabel: "Scheduling Module",
      description: user?.role === "INSTRUCTOR"
        ? "Set your availability windows and manage incoming booking requests."
        : "Book flight training sessions with certified instructors.",
      cta: user?.role === "INSTRUCTOR" ? "Manage Schedule" : "Book Session",
      accent: "sky",
      delay: "animate-fade-up-2",
    },
    ...(user?.role === "ADMIN"
      ? [{
          to: "/admin",
          icon: Shield,
          label: "Command",
          sublabel: "Admin Panel",
          description: "Approve student accounts, manage instructors, and oversee platform users.",
          cta: "Open Admin",
          accent: "violet",
          delay: "animate-fade-up-3",
        }]
      : [{
          to: "/courses",
          icon: Target,
          label: "Progress",
          sublabel: "Your Journey",
          description: user?.role === "STUDENT"
            ? "Track quiz scores, review explanations, and monitor your advancement."
            : "Monitor student engagement and course completion rates.",
          cta: "View Progress",
          accent: "emerald",
          delay: "animate-fade-up-3",
          disabled: true,
        }]),
  ];

  const accentStyles: Record<string, { icon: string; border: string; badge: string; glow: string }> = {
    amber:   { icon: "text-amber-400",  border: "border-amber-500/20 group-hover:border-amber-500/40",   badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",   glow: "group-hover:shadow-amber-500/10" },
    sky:     { icon: "text-sky-400",    border: "border-sky-500/20 group-hover:border-sky-500/40",       badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",         glow: "group-hover:shadow-sky-500/10"   },
    violet:  { icon: "text-violet-400", border: "border-violet-500/20 group-hover:border-violet-500/40", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20", glow: "group-hover:shadow-violet-500/10"},
    emerald: { icon: "text-emerald-400",border: "border-emerald-500/20 group-hover:border-emerald-500/40",badge:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",glow: "group-hover:shadow-emerald-500/10"},
  };

  return (
    <div className="min-h-screen bg-grid relative">
      {/* Atmospheric gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full
                        bg-amber-500/5 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full
                        bg-sky-500/5 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-12">

        {/* ── Hero ── */}
        <div className="mb-16 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="status-dot" />
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-mono">
              Systems Online
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Welcome back,<br />
            <span className="text-amber-400">{user?.name?.split(" ")[0]}</span>
            <span className="text-foreground">.</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed mb-6">
            {user?.role === "STUDENT"
              ? "Your aviation training command center. Learn, schedule, and advance your pilot career."
              : user?.role === "INSTRUCTOR"
              ? "Your instructional hub. Build curriculum, manage sessions, and shape the next generation of aviators."
              : "Platform command panel. Oversee users, courses, and the full AIRMAN ecosystem."}
          </p>

          <div className="horizon w-64" />
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-4 max-w-sm mb-16 animate-fade-up-1">
          {[
            { label: "Courses",  value: "∞",    icon: BookOpen },
            { label: "Sessions", value: "24/7",  icon: Zap      },
            { label: "Modules",  value: "3",     icon: Target   },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg
                                         bg-white/[0.03] border border-white/[0.06]">
              <Icon className="h-4 w-4 text-muted-foreground mb-0.5" />
              <span className="font-display text-xl font-bold text-amber-400">{value}</span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Module cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
          {cards.map(({ to, icon: Icon, label, sublabel, description, cta, accent, delay, disabled }) => {
            const s = accentStyles[accent];
            const inner = (
              <div className={`group relative flex flex-col h-full rounded-xl border bg-card
                              transition-all duration-300 overflow-hidden
                              hover:-translate-y-1 hover:shadow-xl ${s.border} ${s.glow}
                              ${disabled ? "opacity-60 cursor-default" : "cursor-pointer"}`}>
                {/* Top accent line */}
                <div className={`h-px ${
                  accent === "amber"   ? "bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" :
                  accent === "sky"     ? "bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" :
                  accent === "violet"  ? "bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" :
                  "bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
                }`} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`h-12 w-12 rounded-xl border flex items-center justify-center
                                     ${s.badge} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-5 w-5 ${s.icon}`} />
                    </div>
                    {!disabled && (
                      <ChevronRight className={`h-4 w-4 ${s.icon} opacity-0 group-hover:opacity-100
                                               -translate-x-2 group-hover:translate-x-0
                                               transition-all duration-200`} />
                    )}
                  </div>

                  {/* Labels */}
                  <div className="mb-3">
                    <p className={`text-[10px] font-bold tracking-widest uppercase mb-0.5 ${s.icon}`}>
                      {sublabel}
                    </p>
                    <h3 className="font-display text-2xl font-bold text-foreground">
                      {label}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                    {description}
                  </p>

                  {/* CTA */}
                  <div className={`flex items-center gap-2 text-sm font-medium ${s.icon}
                                   ${disabled ? "" : "group-hover:gap-3"} transition-all duration-200`}>
                    <span>{disabled ? "Coming Soon" : cta}</span>
                    {!disabled && <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            );

            return (
              <div key={label} className={delay}>
                {disabled ? inner : <Link to={to}>{inner}</Link>}
              </div>
            );
          })}
        </div>

        {/* ── Footer info ── */}
        <div className="mt-16 flex items-center gap-3 animate-fade-up-4">
          <Plane className="h-3.5 w-3.5 text-muted-foreground/40 -rotate-45" />
          <span className="text-xs text-muted-foreground/40 font-mono tracking-wider">
            {user?.email} · {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
}
