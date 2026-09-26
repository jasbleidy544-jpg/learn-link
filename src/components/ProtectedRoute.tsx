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

  // Gate para estudiantes: diagnóstico obligatorio la primera vez
  // y repetible cada 30 días.
  if (
    userRole === "student" &&
    profile &&
    location.pathname !== "/diagnostico-inicial"
  ) {
    const ultimaFecha = (profile as any).diagnostico_ultima_fecha;
    const completado = (profile as any).diagnostico_completado;

    if (!completado) {
      return <Navigate to="/diagnostico-inicial" replace />;
    }

    // Repetible cada 30 días
    if (ultimaFecha) {
      const dias = Math.floor(
        (Date.now() - new Date(ultimaFecha).getTime()) / 86400000
      );
      if (dias >= 30) {
        return <Navigate to="/diagnostico-inicial" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
