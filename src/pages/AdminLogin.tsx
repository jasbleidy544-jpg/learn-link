import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: roleRow } = await (supabase as any)
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
    if (!roleRow) {
      await supabase.auth.signOut();
      toast({ title: "Acceso denegado", description: "Esta cuenta no tiene permisos de administrador general.", variant: "destructive" });
      setLoading(false);
      return;
    }
    toast({ title: "Bienvenido", description: "Acceso administrador concedido." });
    navigate("/admin");
  };

  const handleReset = async () => {
    if (!form.email) {
      toast({ title: "Ingresa tu correo primero", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/admin-login`,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada." });
  };

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="cloud-card glow-effect border-primary/30">
            <CardHeader className="text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-primary mb-3" />
              <CardTitle className="text-2xl">Administrador General</CardTitle>
              <p className="text-sm text-muted-foreground">Acceso restringido a la cuenta maestra</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="email" required value={form.email} className="pl-10"
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type={show ? "text" : "password"} required value={form.password} className="pl-10 pr-10"
                      onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0" onClick={() => setShow(!show)}>
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verificando..." : "Iniciar sesión"}
                </Button>
                <div className="flex justify-between text-xs">
                  <button type="button" onClick={handleReset} className="text-primary hover:underline">¿Olvidaste tu contraseña?</button>
                  <Link to="/" className="text-muted-foreground hover:underline">Volver</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}