import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Plane, BookOpen, Calendar, Users, LogOut, User, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const ROLE_STYLE: Record<string, string> = {
  ADMIN:      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  INSTRUCTOR: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  STUDENT:    "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function Navbar() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    clearAuth();
    queryClient.clear(); // Wipe all cached queries so next user starts fresh
    navigate("/login");
  };

  const navLinks = [
    { to: "/courses",    label: "Courses",  icon: BookOpen },
    { to: "/scheduling", label: "Schedule", icon: Calendar },
    ...(user.role === "ADMIN" ? [{ to: "/admin", label: "Admin", icon: Users }] : []),
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg
                            bg-amber-500/10 border border-amber-500/20
                            group-hover:bg-amber-500/20 group-hover:border-amber-500/40
                            transition-all duration-200">
              <Plane className="h-4 w-4 text-amber-400 -rotate-45" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-amber-pulse" />
            </div>
            <span className="font-display text-lg font-bold tracking-widest">
              <span className="text-amber-400">AIR</span>
              <span className="text-foreground">MAN</span>
              <span className="text-muted-foreground font-normal tracking-wider text-sm ml-1.5">CORE</span>
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
                            transition-all duration-150
                            ${isActive(to)
                              ? "text-amber-400 bg-amber-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {isActive(to) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-amber-400" />
                )}
              </Link>
            ))}
          </div>

          {/* ── User section ── */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg
                            bg-white/[0.04] border border-white/[0.07]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15">
                <User className="h-3 w-3 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                {user.name}
              </span>
              <span className={`shrink-0 border rounded px-1.5 py-0.5 text-[10px] font-bold
                                tracking-widest uppercase ${ROLE_STYLE[user.role]}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm
                         text-muted-foreground hover:text-red-400 hover:bg-red-500/10
                         transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span>Out</span>
            </button>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground
                       hover:bg-white/[0.05] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                            transition-all duration-150
                            ${isActive(to)
                              ? "text-amber-400 bg-amber-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 px-4 py-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">{user.name}</span>
                <span className={`ml-auto border rounded px-1.5 py-0.5 text-[10px] font-bold
                                  tracking-widest uppercase ${ROLE_STYLE[user.role]}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm
                           text-red-400 hover:bg-red-500/10 transition-all duration-150"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
