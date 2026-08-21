import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, Share2 } from "lucide-react";
import { AREAS, MOTIVOS_ALERTA, PRIORIDADES, StudentLite, fmtFecha, prioridadClass } from "./useInstitucionData";

type Remision = {
  id: string;
  estudiante_id: string;
  area: string;
  motivo: string;
  observacion: string | null;
  prioridad: string;
  estado: string;
  respuesta: string | null;
  created_at: string;
};

const estadoBadge = (e: string) =>
  e === "enviada" ? "secondary" : e === "en revisión" ? "outline" : e === "atendida" ? "default" : "outline";

export default function RemisionesTab({ students }: { students: StudentLite[] }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Remision[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ estudiante_id: "", area: "", motivo: "", observacion: "", prioridad: "media" });

  const nameOf = (id: string) => students.find((s) => s.id === id)?.full_name || "Estudiante";

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("remisiones")
      .select("id, estudiante_id, area, motivo, observacion, prioridad, estado, respuesta, created_at")
      .eq("docente_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("[remisiones]", error.message);
    setItems((data || []) as Remision[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const enviar = async () => {
    if (!user) return;
    if (!form.estudiante_id || !form.area || !form.motivo) {
      toast.error("Completa estudiante, área y motivo");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("remisiones").insert({
      docente_id: user.id,
      estudiante_id: form.estudiante_id,
      institution_id: profile?.institution_id ?? null,
      area: form.area,
      motivo: form.motivo,
      observacion: form.observacion || null,
      prioridad: form.prioridad,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Remisión enviada a " + form.area);
    setOpen(false);
    setForm({ estudiante_id: "", area: "", motivo: "", observacion: "", prioridad: "media" });
    load();
  };

  return (
    <Card className="cloud-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="w-5 h-5 text-primary" />
          Remisiones institucionales
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Send className="w-4 h-4 mr-1" /> Nueva remisión</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Remitir caso a la institución</DialogTitle></DialogHeader>
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
                <Label>Área</Label>
                <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                  <SelectTrigger><SelectValue placeholder="Orientación, Coordinación, Bienestar" /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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
                <Label>Observación</Label>
                <Textarea value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} rows={3} />
              </div>
              <Button className="w-full" onClick={enviar} disabled={saving}>
                {saving ? "Enviando…" : "Enviar caso"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No has remitido casos a las áreas institucionales.</p>
        )}
        {items.map((r) => (
          <div key={r.id} className="rounded-lg border border-border/60 p-3 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{nameOf(r.estudiante_id)}</span>
              <Badge variant="outline">{r.area}</Badge>
              <Badge variant="outline" className={prioridadClass(r.prioridad)}>Prioridad {r.prioridad}</Badge>
              <Badge variant={estadoBadge(r.estado) as any}>{r.estado}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">{fmtFecha(r.created_at)}</span>
            </div>
            <p className="text-sm">{r.motivo}</p>
            {r.observacion && <p className="text-xs text-muted-foreground">{r.observacion}</p>}
            {r.respuesta && (
              <p className="text-xs text-primary border-l-2 border-primary/50 pl-2">Respuesta: {r.respuesta}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}