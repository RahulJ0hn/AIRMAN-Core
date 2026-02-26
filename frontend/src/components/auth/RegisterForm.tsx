import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plane, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { authService } from "@/services/auth.service";
import { toast } from "@/hooks/useToast";

const schema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.register(data);
      toast({ title: "Registration submitted!", description: "Pending admin approval." });
      navigate("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || "Registration failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center
                      overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />

        {/* Concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[360, 260, 160, 60].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-sky-500/10"
              style={{ width: size, height: size }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border border-sky-500/20
                          flex items-center justify-center animate-fade-up">
            <Plane className="h-10 w-10 text-sky-400 -rotate-45" />
          </div>

          <div className="animate-fade-up-1">
            <h1 className="font-display text-5xl font-bold tracking-widest mb-2">
              <span className="text-amber-400">AIR</span>
              <span className="text-foreground">MAN</span>
            </h1>
            <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
              Join the Fleet
            </p>
          </div>

          <div className="horizon w-48 animate-fade-up-2" />

          {/* Onboarding steps */}
          <div className="space-y-3 text-left w-full max-w-xs animate-fade-up-3">
            {[
              "Create your account",
              "Await admin approval",
              "Access training modules",
              "Book flight sessions",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                                 ${i === 0
                                   ? "bg-amber-500 text-black"
                                   : "bg-white/[0.06] border border-white/10 text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 animate-fade-up-4">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-muted-foreground tracking-wider">Secure · Encrypted · Private</span>
          </div>
        </div>

        <div className="absolute top-8 left-8 text-[10px] text-muted-foreground/40 tracking-widest font-mono">
          AIRMAN/CORE/v1.0
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

          <h2 className="font-display text-3xl font-bold mb-1">Create Account</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Join the AIRMAN flight training platform
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Full Name
              </label>
              <input
                placeholder="Bradley Bradshaw"
                autoComplete="name"
                className="w-full h-11 rounded-lg bg-input border border-border px-4 text-sm
                           text-foreground placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                           transition-all duration-150"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@airman.dev"
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
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
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
              {loading ? "Creating Account…" : "Create Account"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
                Sign in
              </Link>
            </p>
          </form>

          <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                New student accounts require admin approval before you can access
                courses and schedule sessions. You'll be notified once approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
