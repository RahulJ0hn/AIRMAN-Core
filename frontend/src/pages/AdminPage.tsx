import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, CheckCircle, Trash2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/admin.service";
import { toast } from "@/hooks/useToast";
import type { Role } from "@/types";
import { formatDate } from "@/lib/utils";

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "default",
  INSTRUCTOR: "secondary",
  STUDENT: "outline",
} as const;

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-700" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Manage users, instructors, and student approvals</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          New Instructor
        </Button>
      </div>

      {/* Create Instructor */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Create Instructor Account</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Pete Mitchell"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="instructor@airman.dev"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 chars"
                />
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={() => createInstructorMutation.mutate(form)}
              disabled={!form.email || !form.name || !form.password || createInstructorMutation.isPending}
            >
              {createInstructorMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create Instructor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["", "STUDENT", "INSTRUCTOR", "ADMIN"] as const).map((r) => (
          <Button
            key={r}
            size="sm"
            variant={roleFilter === r ? "default" : "outline"}
            onClick={() => setRoleFilter(r)}
          >
            {r || "All"}
          </Button>
        ))}
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-muted rounded" />)}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users?.data.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_COLORS[user.role] as "default" | "secondary" | "outline"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.approved ? (
                      <span className="text-green-600 font-medium text-xs">Approved</span>
                    ) : (
                      <span className="text-yellow-600 font-medium text-xs">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!user.approved && user.role === "STUDENT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-700 hover:bg-green-50 h-7 px-2"
                          onClick={() => approveMutation.mutate(user.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                      {user.role !== "ADMIN" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 px-2"
                          onClick={() => {
                            if (confirm(`Delete ${user.name}?`)) deleteMutation.mutate(user.id);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.data.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
