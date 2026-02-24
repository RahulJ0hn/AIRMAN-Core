import { Link, useNavigate } from "react-router-dom";
import { Plane, BookOpen, Calendar, Users, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-700">
            <Plane className="h-6 w-6" />
            <span>AIRMAN Core</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link to="/courses">
              <Button variant="ghost" size="sm" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Courses
              </Button>
            </Link>

            <Link to="/scheduling">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </Button>
            </Link>

            {user.role === "ADMIN" && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.name}</span>
              <Badge variant={user.role === "ADMIN" ? "default" : user.role === "INSTRUCTOR" ? "secondary" : "outline"}>
                {user.role}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
