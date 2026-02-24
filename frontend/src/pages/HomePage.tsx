import { Link } from "react-router-dom";
import { BookOpen, Calendar, Trophy, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-blue-700 p-4">
            <Plane className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Your flight training command center. Learn, schedule, and track your aviation journey.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <Link to="/courses">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Maverick Learning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Browse courses, study lessons, and test your knowledge with quizzes.
              </p>
              <Button variant="outline" size="sm" className="w-full">Browse Courses</Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/scheduling">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-green-500" />
                Skynet Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {user?.role === "INSTRUCTOR"
                  ? "Set your availability and manage student bookings."
                  : "Book flight training sessions with instructors."}
              </p>
              <Button variant="outline" size="sm" className="w-full">
                {user?.role === "INSTRUCTOR" ? "Manage Schedule" : "Book Session"}
              </Button>
            </CardContent>
          </Card>
        </Link>

        {(user?.role === "STUDENT" || user?.role === "INSTRUCTOR") && (
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-orange-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {user?.role === "STUDENT"
                  ? "Track quiz scores, review incorrect answers, and see your growth."
                  : "Monitor student engagement and course completion."}
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        )}

        {user?.role === "ADMIN" && (
          <Link to="/admin">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  Admin Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Manage users, approve students, and create instructor accounts.
                </p>
                <Button variant="outline" size="sm" className="w-full">Open Admin</Button>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Role badge */}
      <div className="text-center mt-12 text-sm text-muted-foreground">
        Logged in as <span className="font-semibold text-foreground">{user?.role}</span> • {user?.email}
      </div>
    </div>
  );
}
