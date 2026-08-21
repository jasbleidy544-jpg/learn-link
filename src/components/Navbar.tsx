import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Star, LogOut, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, userRole, profile, signOut } = useAuth();

  const goAccess = (action: "login" | "register") => {
    navigate(`/access?action=${action}`);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardPath = () => {
    if (userRole === "student") return "/student-dashboard";
    if (userRole === "teacher") {
      return profile?.teacher_type === "retired" ? "/panel-jubilado" : "/teacher-dashboard";
    }
    if (userRole === "institution") return "/institution-dashboard";
    return "/";
  };

  return (
    <nav className="fixed top-0 w-full z-50 cloud-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <Star className="h-8 w-8 text-primary animate-pulse" />
              <div className="absolute inset-0 h-8 w-8 text-accent opacity-50 animate-ping">
                <Star className="h-8 w-8" />
              </div>
            </div>
            <span className="text-xl font-bold text-gradient">LearnLink</span>
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="text-foreground hover:text-primary transition-colors duration-200">Inicio</Link>
              <Link to="/about" className="text-foreground hover:text-primary transition-colors duration-200">Nosotros</Link>
              <Link to="/how-it-works" className="text-foreground hover:text-primary transition-colors duration-200">Cómo Funciona</Link>
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors duration-200">Planes</Link>
              {user && (
                <Link to={getDashboardPath()} className="text-primary hover:text-accent transition-colors duration-200 font-medium">
                  Mi Panel
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{profile?.full_name || user.email}</span>
                <Button variant="ghost" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Salir
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={() => goAccess("login")}>
                  <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión
                </Button>
                <Button variant="default" className="glow-effect" onClick={() => goAccess("register")}>
                  <UserPlus className="w-4 h-4 mr-2" /> Registrarse
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" className="block text-foreground hover:text-primary px-3 py-2 transition-colors">Inicio</Link>
              <Link to="/about" className="block text-foreground hover:text-primary px-3 py-2 transition-colors">Nosotros</Link>
              <Link to="/how-it-works" className="block text-foreground hover:text-primary px-3 py-2 transition-colors">Cómo Funciona</Link>
              <Link to="/pricing" className="block text-foreground hover:text-primary px-3 py-2 transition-colors">Planes</Link>
              <div className="border-t border-border my-2" />
              {user ? (
                <>
                  <Link to={getDashboardPath()} className="block text-primary hover:text-accent px-3 py-2 font-medium">Mi Panel</Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => goAccess("login")}>
                      <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                    </Button>
                    <Button variant="default" className="w-full justify-start glow-effect" onClick={() => goAccess("register")}>
                      <UserPlus className="mr-2 h-4 w-4" /> Crear cuenta nueva
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
