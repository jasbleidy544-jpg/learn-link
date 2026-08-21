import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AlertTriangle, Plus } from "lucide-react";
import {
  ESTADOS_ALERTA, MOTIVOS_ALERTA, PRIORIDADES, StudentLite,
  estadoVariant, fmtFecha, prioridadClass,
} from "./useInstitucionData";

type Alerta = {
  id: string;
  estudiante_id: string;
  motivo: string;
  detalle: string | null;
  prioridad: string;
  estado: string;
  created_at: string;
};

export default function AlertasTempranasTab({ students }: { students: StudentLite[] }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ estudiante_id: "", motivo: "", detalle: "", prioridad: "media" });

  const nameOf = (id: string) => students.find((s) => s.id === id)?.full_name || "Estudiante";

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("alertas_tempranas")
      .select("id, estudiante_id, motivo, detalle, prioridad, estado, created_at")
      .eq("docente_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("[alertas]", error.message);
    setItems((data || []) as Alerta[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const crear = async () => {
    if (!user) return;
    if (!form.estudiante_id || !form.motivo) {
      toast.error("Selecciona estudiante y motivo");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("alertas_tempranas").insert({
      docente_id: user.id,
      estudiante_id: form.estudiante_id,
      institution_id: profile?.institution_id ?? null,
      motivo: form.motivo,
      detalle: form.detalle || null,
      prioridad: form.prioridad,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Alerta registrada");
    setOpen(false);
    setForm({ estudiante_id: "", motivo: "", detalle: "", prioridad: "media" });
    load();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    const { error } = await (supabase as any).from("alertas_tempranas").update({ estado }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, estado } : a)));
  };

  return (
    <Card className="cloud-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Alertas tempranas
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nueva alerta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Registrar alerta temprana</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Estudiante</Label>
                <Select value={form.estudiante_id} onValueChange={(v) => setForm({ ...form, estudiante_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Motivo</Label>
                <Select value={form.motivo} onValueChange={(v) => setForm({ ...form, motivo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona el motivo" /></SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_ALERTA.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Observación (opcional)</Label>
                <Textarea value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} rows={3} />
              </div>
              <Button className="w-full" onClick={crear} disabled={saving}>
                {saving ? "Guardando…" : "Registrar alerta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no has registrado alertas para tus estudiantes.</p>
        )}
        {items.map((a) => (
          <div key={a.id} className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{nameOf(a.estudiante_id)}</span>
              <Badge variant="outline" className={prioridadClass(a.prioridad)}>Prioridad {a.prioridad}</Badge>
              <Badge variant={estadoVariant(a.estado)}>{a.estado}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">{fmtFecha(a.created_at)}</span>
            </div>
            <p className="text-sm">{a.motivo}</p>
            {a.detalle && <p className="text-xs text-muted-foreground">{a.detalle}</p>}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select value={a.estado} onValueChange={(v) => cambiarEstado(a.id, v)}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_ALERTA.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}