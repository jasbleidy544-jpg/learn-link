import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen night-sky flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Gate students: first-time login must complete diagnostic
  if (
    userRole === "student" &&
    profile &&
    profile.diagnostico_completado === false &&
    location.pathname !== "/diagnostico-inicial"
  ) {
    return <Navigate to="/diagnostico-inicial" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
