import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Mail, Lock, Star, Eye, EyeOff, GraduationCap, Users, Building, ShieldCheck } from "lucide-react";

const ROLE_META: Record<string, { label: string; icon: any; dashboard: string }> = {
  student: { label: "Estudiante", icon: GraduationCap, dashboard: "/student-dashboard" },
  teacher: { label: "Docente", icon: Users, dashboard: "/teacher-dashboard" },
  institution: { label: "Institución", icon: Building, dashboard: "/institution-dashboard" },
};

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const expectedRole = searchParams.get("role") || "";
  const rawNext = searchParams.get("next") || "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";
  const meta = ROLE_META[expectedRole];
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message === "Invalid login credentials" 
          ? "Credenciales incorrectas. Verifica tu email y contraseña."
          : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({ title: "¡Bienvenido!", description: "Sesión iniciada correctamente." });

    if (nextPath) {
      navigate(nextPath, { replace: true });
      setIsLoading(false);
      return;
    }
    
    // Fetch role and redirect
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      const role = roleData?.role;
      if (expectedRole && role && role !== expectedRole) {
        toast({
          title: "Rol incorrecto",
          description: `Esta cuenta no es de ${ROLE_META[expectedRole]?.label}. Te llevamos a tu panel.`,
          variant: "destructive",
        });
      }
      if (role === "student") navigate("/student-dashboard");
      else if (role === "teacher") {
        const { data: prof } = await (supabase as any)
          .from("profiles").select("teacher_type").eq("id", user.id).maybeSingle();
        navigate(prof?.teacher_type === "retired" ? "/panel-jubilado" : "/teacher-dashboard");
      }
      else if (role === "institution") navigate("/institution-dashboard");
      else navigate("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="cloud-card glow-effect">
            <CardHeader className="text-center">
              <div className="text-primary mb-4">
                {meta ? <meta.icon className="w-12 h-12 mx-auto animate-pulse" /> : <Star className="w-12 h-12 mx-auto animate-pulse" />}
              </div>
              <CardTitle className="text-3xl font-bold mb-2">
                {meta ? `Acceso ${meta.label}` : "Bienvenido de vuelta"}
              </CardTitle>
              <p className="text-muted-foreground">
                {meta ? `Ingresa a tu cuenta de ${meta.label.toLowerCase()}` : "Ingresa a tu cuenta de LearnLink"}
              </p>
              {!meta && (
                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                  {Object.entries(ROLE_META).map(([key, m]) => (
                    <Button key={key} size="sm" variant="outline" onClick={() => navigate(`/login?role=${key}`)}>
                      <m.icon className="w-4 h-4 mr-1" /> {m.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="tu@email.com" className="pl-10"
                      value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" name="password" type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña" className="pl-10 pr-10"
                      value={formData.password} onChange={handleInputChange} required />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full glow-effect text-lg py-6" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                      Iniciando sesión...
                    </div>
                  ) : 'Iniciar Sesión'}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register/student" className="text-primary hover:text-accent font-medium">
                    Regístrate gratis
                  </Link>
                </div>
                <div className="pt-4 mt-2 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-primary/40 hover:bg-primary/10"
                    onClick={() => navigate("/admin-login")}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                    Iniciar sesión como Administrador General
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
