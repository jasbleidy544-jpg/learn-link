import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Megaphone, MessagesSquare } from "lucide-react";
import { AREAS, fmtFecha } from "./useInstitucionData";

type Mensaje = {
  id: string;
  area: string;
  asunto: string | null;
  cuerpo: string;
  es_comunicado: boolean;
  sender_id: string;
  created_at: string;
};

export default function ComunicacionInstitucionalTab() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ area: "Coordinación", asunto: "", cuerpo: "" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("mensajes_institucionales")
      .select("id, area, asunto, cuerpo, es_comunicado, sender_id, created_at")
      .eq("docente_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("[mensajes]", error.message);
    setItems((data || []) as Mensaje[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`mensajes-inst-${user.id}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "mensajes_institucionales", filter: `docente_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const enviar = async () => {
    if (!user) return;
    if (!form.cuerpo.trim()) { toast.error("Escribe el mensaje"); return; }
    setSending(true);
    const { error } = await (supabase as any).from("mensajes_institucionales").insert({
      docente_id: user.id,
      sender_id: user.id,
      institution_id: profile?.institution_id ?? null,
      area: form.area,
      asunto: form.asunto || null,
      cuerpo: form.cuerpo.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mensaje enviado a " + form.area);
    setForm({ ...form, asunto: "", cuerpo: "" });
    load();
  };

  const comunicados = items.filter((m) => m.es_comunicado);
  const conversacion = items.filter((m) => !m.es_comunicado);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessagesSquare className="w-5 h-5 text-primary" /> Enviar mensaje institucional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Área</Label>
            <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Asunto</Label>
            <Input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} placeholder="Asunto del mensaje" />
          </div>
          <div className="space-y-1">
            <Label>Mensaje</Label>
            <Textarea rows={4} value={form.cuerpo} onChange={(e) => setForm({ ...form, cuerpo: e.target.value })} />
          </div>
          <Button className="w-full" onClick={enviar} disabled={sending}>
            {sending ? "Enviando…" : "Enviar"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="cloud-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="w-5 h-5 text-accent" /> Avisos y comunicados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {!loading && comunicados.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay comunicados de tu institución por ahora.</p>
            )}
            {comunicados.map((m) => (
              <div key={m.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{m.area}</Badge>
                  <span className="font-medium text-sm">{m.asunto || "Comunicado"}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{fmtFecha(m.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{m.cuerpo}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="cloud-card">
          <CardHeader><CardTitle className="text-base">Conversaciones</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!loading && conversacion.length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no tienes mensajes con las áreas institucionales.</p>
            )}
            {conversacion.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg p-3 border ${m.sender_id === user?.id ? "border-primary/40 bg-primary/5" : "border-border/60"}`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{m.sender_id === user?.id ? "Tú" : m.area}</Badge>
                  {m.asunto && <span className="text-sm font-medium">{m.asunto}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{fmtFecha(m.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{m.cuerpo}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}