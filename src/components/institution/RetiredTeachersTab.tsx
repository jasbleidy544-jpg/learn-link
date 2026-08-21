import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { HeartHandshake, Search, Send, Users, Eye } from "lucide-react";

interface Props {
  institutionId: string | null;
  institutionName?: string;
  students: { id: string; full_name: string; grade?: string | null }[];
}

type Jubilado = {
  id: string;
  full_name: string;
  email: string | null;
  subjects: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  assigned_count: number;
  active: boolean;
};

export default function RetiredTeachersTab({ institutionId, institutionName, students }: Props) {
  const [allRetired, setAllRetired] = useState<Jubilado[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Jubilado | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewStudentsOf, setViewStudentsOf] = useState<Jubilado | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [bannerDebug, setBannerDebug] = useState<string>("Consultando jubilados...");

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    // ALL retired teachers registered in the platform
    const { data: profs, error: pErr } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, email, subjects, created_at, last_sign_in_at, teacher_type")
      .eq("teacher_type", "retired");
    setBannerDebug(
      `Jubilados encontrados: ${profs?.length ?? 0} · Error: ${pErr?.message ?? "ninguno"} · Primer resultado: ${JSON.stringify(profs?.[0] ?? null)}`
    );
    if (pErr) {
      console.error("[RetiredTeachersTab] load profiles", pErr);
      setErrorMsg(pErr.message);
      toast({ title: "Error cargando docentes jubilados", description: pErr.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const ids = (profs || []).map((p: any) => p.id);
    let countsMap = new Map<string, number>();
    if (ids.length) {
      const { data: assigns } = await (supabase as any)
        .from("asignaciones")
        .select("docente_id")
        .in("docente_id", ids);
      (assigns || []).forEach((a: any) => countsMap.set(a.docente_id, (countsMap.get(a.docente_id) || 0) + 1));
    }
    const threeDaysAgo = Date.now() - 3 * 86400000;
    setAllRetired((profs || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      subjects: p.subjects,
      created_at: p.created_at,
      last_sign_in_at: p.last_sign_in_at,
      assigned_count: countsMap.get(p.id) || 0,
      active: p.last_sign_in_at ? new Date(p.last_sign_in_at).getTime() >= threeDaysAgo : false,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRetired;
    return allRetired.filter((j) =>
      (j.full_name || "").toLowerCase().includes(q) ||
      (j.email || "").toLowerCase().includes(q)
    );
  }, [allRetired, query]);

  const openAssignFor = (j: Jubilado) => {
    setAssignTarget(j);
    setSelected(new Set());
    setAssignOpen(true);
  };

  const sendRequests = async () => {
    if (!assignTarget || !institutionId || selected.size === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Sesión expirada", variant: "destructive" }); return; }
    const rows = Array.from(selected).map((sid) => ({
      docente_jubilado_id: assignTarget.id,
      estudiante_id: sid,
      institution_id: institutionId,
      creado_por: user.id,
      estado: "pendiente",
    }));
    const { error } = await (supabase as any).from("solicitudes_jubilado").upsert(rows, {
      onConflict: "docente_jubilado_id,estudiante_id,institution_id",
    });
    if (error) {
      console.error("[solicitudes_jubilado][insert]", error);
      toast({ title: "Error al enviar solicitud", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✓ Solicitud enviada al docente", description: `${rows.length} solicitud(es) pendiente(s).` });
    setAssignOpen(false);
    load();
  };

  const openViewStudents = async (j: Jubilado) => {
    setViewStudentsOf(j);
    const { data } = await (supabase as any)
      .from("asignaciones")
      .select("estudiante_id, profiles!asignaciones_estudiante_id_fkey (id, full_name, email, grade)")
      .eq("docente_id", j.id);
    setAssignedStudents((data || []).map((a: any) => a.profiles).filter(Boolean));
  };

  return (
    <div className="space-y-4">
      <Card className="cloud-card">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-pink-400" />
            Docentes Jubilados ({filtered.length})
          </CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o correo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 p-3 rounded border border-yellow-500/50 bg-yellow-500/10 text-xs text-yellow-200 font-mono break-all">
            {bannerDebug}
          </div>
          {errorMsg && (
            <div className="mb-3 p-3 rounded border border-destructive/40 bg-destructive/10 text-sm text-destructive">
              {errorMsg}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Materia</th>
                  <th className="py-2 pr-3">Correo</th>
                  <th className="py-2 pr-3">Estudiantes que asesora</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">Cargando…</td></tr>
                )}
                {!loading && allRetired.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">
                    Aún no hay docentes jubilados registrados en LearnLink.
                  </td></tr>
                )}
                {!loading && allRetired.length > 0 && filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">
                    No se encontraron docentes jubilados con ese nombre o correo.
                  </td></tr>
                )}
                {filtered.map((j) => (
                  <tr key={j.id} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-medium">{j.full_name}</td>
                    <td className="py-2 pr-3">{j.subjects || "—"}</td>
                    <td className="py-2 pr-3">{j.email || "—"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{j.assigned_count}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => openViewStudents(j)}>
                          <Eye className="w-3 h-3 mr-1" /> Ver
                        </Button>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={j.active ? "default" : "outline"}>
                        {j.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Button size="sm" onClick={() => openAssignFor(j)}>
                        <Send className="w-3 h-3 mr-1" /> Enviar solicitud
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assign students modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar estudiantes a {assignTarget?.full_name}</DialogTitle>
            <DialogDescription>
              Selecciona uno o varios estudiantes. Se enviará una solicitud al docente — la asignación se concreta cuando él acepte.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80 pr-2">
            <div className="space-y-2">
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No hay estudiantes en la institución.</p>
              )}
              {students.map((s) => {
                const checked = selected.has(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-3 p-2 rounded cloud-card cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        if (v) next.add(s.id); else next.delete(s.id);
                        setSelected(next);
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground">{s.grade || "—"}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button onClick={sendRequests} disabled={selected.size === 0}>
              <Send className="w-4 h-4 mr-1" /> Enviar solicitud de asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View assigned students of a retired teacher */}
      <Dialog open={!!viewStudentsOf} onOpenChange={(o) => !o && setViewStudentsOf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estudiantes que asesora {viewStudentsOf?.full_name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {assignedStudents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin estudiantes asignados todavía.</p>
              )}
              {assignedStudents.map((s) => (
                <div key={s.id} className="p-3 rounded cloud-card">
                  <div className="text-sm font-medium">{s.full_name}</div>
                  <div className="text-xs text-muted-foreground">{s.email} · {s.grade || "—"}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}