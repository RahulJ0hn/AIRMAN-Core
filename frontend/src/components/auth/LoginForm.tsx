import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plane, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";

const schema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

const DEMO = [
  { role: "Admin",      email: "admin@airman.dev",      pass: "admin123!" },
  { role: "Instructor", email: "maverick@airman.dev",   pass: "instructor123!" },
  { role: "Student",    email: "rooster@airman.dev",    pass: "student123!" },
];

export function LoginForm() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPw, setShowPw]     = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await authService.login(data);
      setAuth(result.user, result.token);
      toast({ title: "Welcome back!", description: `Hello, ${result.user.name}` });
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || "Login failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left panel (decorative) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center
                      overflow-hidden bg-grid">
        {/* Atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-sky-500/5" />

        {/* Radar circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          {[320, 240, 160, 80].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-amber-500/10 animate-radar-pulse"
              style={{
                width:  size,
                height: size,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
          {/* Sweep arm */}
          <div className="absolute w-40 h-40 animate-radar-spin" style={{ transformOrigin: "center" }}>
            <div className="absolute top-1/2 left-1/2 w-[80px] h-px"
                 style={{
                   background: "linear-gradient(90deg, hsl(38 95% 52% / 0.6), transparent)",
                   transformOrigin: "left center",
                 }}
            />
          </div>
          {/* Center dot */}
          <div className="absolute w-2 h-2 rounded-full bg-amber-400 amber-glow-sm" />
        </div>

        {/* Large plane silhouette */}
        <div className="relative z-10 flex flex-col items-center gap-8 text-center px-12">
          <div className="w-24 h-24 rounded-2xl bg-amber-500/10 border border-amber-500/20
                          flex items-center justify-center amber-glow animate-fade-up">
            <Plane className="h-12 w-12 text-amber-400 -rotate-45" />
          </div>

          <div className="animate-fade-up-1">
            <h1 className="font-display text-5xl font-bold tracking-widest mb-2">
              <span className="text-amber-400">AIR</span>
              <span className="text-foreground">MAN</span>
            </h1>
            <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
              Flight School Management
            </p>
          </div>

          <div className="horizon w-48 animate-fade-up-2" />

          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs animate-fade-up-3">
            "The engine is the heart of an aeroplane, but the pilot is its soul."
          </p>

          {/* System status */}
          <div className="flex items-center gap-2 animate-fade-up-4">
            <span className="status-dot" />
            <span className="text-xs text-muted-foreground tracking-wider uppercase">
              Systems Nominal
            </span>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 text-[10px] text-muted-foreground/40 tracking-widest font-mono">
          AIRMAN/CORE/v1.0
        </div>
        <div className="absolute bottom-8 left-8 text-[10px] text-muted-foreground/40 tracking-widest font-mono">
          FMS · MAVERICK · SKYNET
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-dots opacity-50" />

        <div className="relative w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20
                            flex items-center justify-center">
              <Plane className="h-4 w-4 text-amber-400 -rotate-45" />
            </div>
            <span className="font-display text-lg font-bold tracking-widest">
              <span className="text-amber-400">AIR</span>
              <span className="text-foreground">MAN</span>
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold mb-1">Sign In</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Access your flight training dashboard
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Email Address
              </label>
              <input
                type="email"
                placeholder="pilot@airman.dev"
                autoComplete="email"
                className="w-full h-11 rounded-lg bg-input border border-border px-4 text-sm
                           text-foreground placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                           transition-all duration-150"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 rounded-lg bg-input border border-border px-4 pr-11 text-sm
                             text-foreground placeholder:text-muted-foreground/50
                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                             transition-all duration-150"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                             hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30
                              bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold
                         text-sm tracking-wide hover:bg-primary/90 active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-150 flex items-center justify-center gap-2
                         amber-glow-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Authenticating…" : "Sign In"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/register" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
                Register here
              </Link>
            </p>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Demo Credentials
            </p>
            <div className="space-y-2">
              {DEMO.map(({ role, email, pass }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(email, pass)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md
                             bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05]
                             text-xs transition-all duration-150 group"
                >
                  <span className={`font-semibold tracking-wider uppercase ${
                    role === "Admin" ? "text-amber-400" :
                    role === "Instructor" ? "text-sky-400" : "text-slate-400"
                  }`}>
                    {role}
                  </span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors font-mono">
                    {email}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              Click a row to auto-fill credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
