import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { HomePage } from "@/pages/HomePage";
import { CoursesPage } from "@/pages/CoursesPage";
import { CourseDetailPage } from "@/pages/CourseDetailPage";
import { LessonPage } from "@/pages/LessonPage";
import { SchedulingPage } from "@/pages/SchedulingPage";
import { AdminPage } from "@/pages/AdminPage";
import { CreateCoursePage } from "@/pages/CreateCoursePage";
import { CreateModulePage } from "@/pages/CreateModulePage";
import { CreateLessonPage } from "@/pages/CreateLessonPage";
import { useAuth } from "@/hooks/useAuth";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CoursesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/new"
          element={
            <ProtectedRoute roles={["INSTRUCTOR", "ADMIN"]}>
              <AppLayout>
                <CreateCoursePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:courseId/modules/new"
          element={
            <ProtectedRoute roles={["INSTRUCTOR", "ADMIN"]}>
              <AppLayout>
                <CreateModulePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/modules/:moduleId/lessons/new"
          element={
            <ProtectedRoute roles={["INSTRUCTOR", "ADMIN"]}>
              <AppLayout>
                <CreateLessonPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CourseDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/lessons/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LessonPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scheduling"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SchedulingPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AppLayout>
                <AdminPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </>
  );
}
