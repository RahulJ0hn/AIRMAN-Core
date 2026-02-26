import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, CheckCircle, Trash2, Loader2, Shield, X, ChevronDown } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "@/hooks/useToast";
import type { Role } from "@/types";
import { formatDate } from "@/lib/utils";

const ROLE_STYLE: Record<Role, string> = {
  ADMIN:      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  INSTRUCTOR: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  STUDENT:    "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const FILTER_LABELS: Record<string, string> = {
  "": "All",
  STUDENT: "Students",
  INSTRUCTOR: "Instructors",
  ADMIN: "Admins",
};

export function AdminPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "" });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => adminService.listUsers({ role: roleFilter ? roleFilter : undefined, limit: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: adminService.approveStudent,
    onSuccess: () => {
      toast({ title: "Student approved" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast({ title: "Error", description: "Approval failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      toast({ title: "User deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Delete failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const createInstructorMutation = useMutation({
    mutationFn: adminService.createInstructor,
    onSuccess: () => {
      toast({ title: "Instructor created" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setShowCreateForm(false);
      setForm({ email: "", name: "", password: "" });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const inputCls = `w-full h-10 rounded-lg bg-input border border-border px-3 text-sm
    text-foreground placeholder:text-muted-foreground/50
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
    transition-all duration-150`;

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-violet-500/4 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-6xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-violet-500/10 border border-violet-500/20
                              flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <span className="text-xs text-violet-400 font-bold tracking-widest uppercase">
                Command Panel
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold">Admin</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, approve students, and create instructor accounts.
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                        shrink-0 transition-all active:scale-[0.98]
                        ${showCreateForm
                          ? "bg-white/[0.06] border border-white/[0.12] text-muted-foreground hover:text-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 amber-glow-sm"}`}
          >
            {showCreateForm
              ? <><X className="h-4 w-4" /> Cancel</>
              : <><UserPlus className="h-4 w-4" /> New Instructor</>}
          </button>
        </div>

        {/* ── Create Instructor Form ── */}
        {showCreateForm && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 mb-8 animate-fade-up">
            <div className="flex items-center gap-2 mb-5">
              <UserPlus className="h-4 w-4 text-amber-400" />
              <h2 className="font-display text-base font-semibold text-amber-400 tracking-wide">
                Create Instructor Account
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Full Name
                </label>
                <input
                  className={inputCls}
                  placeholder="Pete Mitchell"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="instructor@airman.dev"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Password
                </label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="Min. 6 chars"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
            </div>
            <button
              className="mt-5 h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold
                         hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 amber-glow-sm"
              onClick={() => createInstructorMutation.mutate(form)}
              disabled={!form.email || !form.name || !form.password || createInstructorMutation.isPending}
            >
              {createInstructorMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Instructor
            </button>
          </div>
        )}

        <div className="horizon mb-8 animate-fade-up-1" />

        {/* ── Filters ── */}
        <div className="flex items-center gap-2 mb-6 animate-fade-up-1">
          <span className="text-xs text-muted-foreground tracking-wider uppercase font-semibold mr-1">
            Filter:
          </span>
          {(["", "STUDENT", "INSTRUCTOR", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150
                          ${roleFilter === r
                            ? r === "STUDENT"   ? "bg-slate-500/20 text-slate-300 border border-slate-500/40"
                            : r === "INSTRUCTOR"? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                            : r === "ADMIN"     ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            :                    "bg-white/[0.08] text-foreground border border-white/[0.12]"
                            : "bg-transparent text-muted-foreground border border-border hover:border-white/20 hover:text-foreground"}`}
            >
              {FILTER_LABELS[r]}
            </button>
          ))}

          {users && (
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {users.data.length} user{users.data.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── User Table ── */}
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden animate-fade-up-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                    Name
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-muted-foreground hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-muted-foreground hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-widest uppercase text-muted-foreground hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users?.data.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground">{user.name}</td>
                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`border rounded px-2 py-0.5 text-[10px] font-bold
                                        tracking-widest uppercase ${ROLE_STYLE[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {user.approved ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-amber-pulse" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!user.approved && user.role === "STUDENT" && (
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                       text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10
                                       transition-all duration-150 disabled:opacity-50"
                            onClick={() => approveMutation.mutate(user.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                        )}
                        {user.role !== "ADMIN" && (
                          <button
                            className="flex items-center justify-center h-7 w-7 rounded-lg
                                       text-muted-foreground hover:text-red-400 hover:bg-red-500/10
                                       transition-all duration-150 disabled:opacity-50"
                            onClick={() => {
                              if (confirm(`Delete ${user.name}?`)) deleteMutation.mutate(user.id);
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users?.data.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <ChevronDown className="h-8 w-8 mx-auto mb-3 opacity-20" />
                No users found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
