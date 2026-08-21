import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Building2, GraduationCap, HeartHandshake, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type ContactRow = { id: string; full_name: string; email: string | null; phone: string | null; subjects?: string | null; institution?: string | null };

const ProfileDialog = () => {
  const { profile, updateProfile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<ContactRow[]>([]);
  const [volunteers, setVolunteers] = useState<ContactRow[]>([]);
  const [institutionContact, setInstitutionContact] = useState<ContactRow | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    grade: "",
    institution: "",
    phone: "",
    location: "",
    apodo_estudiante: "",
    nombre_ia: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        grade: profile.grade ?? "",
        institution: profile.institution ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
        apodo_estudiante: profile.apodo_estudiante ?? "",
        nombre_ia: profile.nombre_ia ?? "",
      });
    }
  }, [profile, open]);

  useEffect(() => {
    const load = async () => {
      if (!open || !profile?.institution) return;
      // Teachers + volunteers in same institution
      const { data: roleRows } = await (supabase as any)
        .from("user_roles").select("user_id,role")
        .in("role", ["teacher"]);
      const ids = (roleRows || []).map((r: any) => r.user_id);
      if (ids.length) {
        const { data: ts } = await (supabase as any)
          .from("profiles").select("id,full_name,email,phone,subjects,institution,description")
          .in("id", ids);
        const same = (ts || []).filter((t: any) => t.institution === profile.institution);
        const ext = (ts || []).filter((t: any) => t.institution !== profile.institution);
        setTeachers(same);
        setVolunteers(ext);
      }
      // Institution contact = institution admin profile (if exists) - take first admin in same institution
      const { data: instRoles } = await (supabase as any)
        .from("user_roles").select("user_id").eq("role", "institution");
      const instIds = (instRoles || []).map((r: any) => r.user_id);
      if (instIds.length) {
        const { data: ip } = await (supabase as any)
          .from("profiles").select("id,full_name,email,phone,institution")
          .in("id", instIds);
        const match = (ip || []).find((p: any) => p.institution === profile.institution) || null;
        setInstitutionContact(match);
      }
    };
    load();
  }, [open, profile?.institution]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar el perfil");
    } else {
      toast.success("Perfil actualizado");
      setOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
          <User className="w-6 h-6" /> Mi Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mi Perfil</DialogTitle>
          <DialogDescription>Tu información, contactos de apoyo y preferencias de la IA</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Datos personales</h3>
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label>Nombre completo</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label>Grado</Label>
            <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </div>
          <div>
            <Label>Institución</Label>
            <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Ubicación</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Personalización IA</h3>
            <div>
              <Label>Mi apodo</Label>
              <Input value={form.apodo_estudiante} onChange={(e) => setForm({ ...form, apodo_estudiante: e.target.value })} placeholder="Cómo quieres que te llame la IA" />
            </div>
            <div>
              <Label>Nombre de la IA</Label>
              <Input value={form.nombre_ia} onChange={(e) => setForm({ ...form, nombre_ia: e.target.value })} placeholder="Ej: Luna, Aira, Sofi..." />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Mi institución</h3>
            {institutionContact ? (
              <div className="p-3 rounded-md border">
                <p className="font-medium">{institutionContact.full_name || profile?.institution}</p>
                {institutionContact.phone && <p className="text-sm">📞 {institutionContact.phone}</p>}
                {institutionContact.email && <p className="text-sm">✉️ {institutionContact.email}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {profile?.institution || "Sin institución asignada"} · contactos no disponibles
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> Profesores de la institución</h3>
            {teachers.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay profesores registrados.</p>}
            <div className="grid sm:grid-cols-2 gap-2">
              {teachers.map((t) => (
                <div key={t.id} className="p-3 rounded-md border text-sm">
                  <p className="font-medium">{t.full_name}</p>
                  {t.subjects && <p className="text-xs text-muted-foreground">{t.subjects}</p>}
                  {t.phone && <p>📞 {t.phone}</p>}
                  {t.email && <p>✉️ {t.email}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-primary" /> Docentes voluntarios</h3>
            {volunteers.length === 0 && <p className="text-sm text-muted-foreground">No tienes mentores voluntarios conectados todavía.</p>}
            <div className="grid sm:grid-cols-2 gap-2">
              {volunteers.map((t) => (
                <div key={t.id} className="p-3 rounded-md border text-sm">
                  <p className="font-medium">{t.full_name}</p>
                  {t.subjects && <p className="text-xs text-muted-foreground">{t.subjects}</p>}
                  {t.phone && <p>📞 {t.phone}</p>}
                  {t.email && <p>✉️ {t.email}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button variant="destructive" onClick={handleSignOut} className="sm:mr-auto">
            <LogOut className="w-4 h-4 mr-1" /> Cerrar sesión
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;