import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { User, Bot, Save } from "lucide-react";

export default function StudentSettings() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    apodo_estudiante: profile?.apodo_estudiante || "",
    nombre_ia: profile?.nombre_ia || "abi",
    grade: profile?.grade || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "✓ Cambios guardados" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza tu perfil y la forma en que la IA se comunica contigo
        </p>
      </div>

      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Mi perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre completo</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Grado</Label>
              <Input
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                placeholder="Ej: 10°"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Ubicación</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Mi IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre de tu IA</Label>
            <Input
              value={form.nombre_ia}
              onChange={(e) => setForm({ ...form, nombre_ia: e.target.value })}
              placeholder="Ej: abi"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Así llamarás a tu asistente personal.
            </p>
          </div>
          <div>
            <Label>Tu apodo</Label>
            <Input
              value={form.apodo_estudiante}
              onChange={(e) =>
                setForm({ ...form, apodo_estudiante: e.target.value })
              }
              placeholder="Ej: diego"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cómo quieres que la IA y tus docentes te llamen.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}