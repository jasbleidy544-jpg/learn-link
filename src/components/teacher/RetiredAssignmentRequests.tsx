import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Check, X, User as UserIcon, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Solicitud = {
  id: string;
  estudiante_id: string;
  institution_id: string;
  estado: string;
  creado_en: string;
  visto: boolean;
  institution_name?: string;
  student?: any;
};

export default function RetiredAssignmentRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Solicitud[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: reqs, error } = await (supabase as any)
      .from("solicitudes_jubilado")
      .select("id, estudiante_id, institution_id, estado, creado_en, visto")
      .eq("docente_jubilado_id", user.id)
      .order("creado_en", { ascending: false });
    if (error) {
      console.error("[solicitudes][load]", error);
      toast({ title: "Error cargando solicitudes", description: error.message, variant: "destructive" });
      return;
    }
    const ids = (reqs || []).map((r: any) => r.estudiante_id);
    const instIds = Array.from(new Set((reqs || []).map((r: any) => r.institution_id)));
    const [{ data: studs }, { data: insts }] = await Promise.all([
      ids.length
        ? (supabase as any).from("profiles").select("id, full_name, email, grade, grado, diagnostico_intereses, diagnostico_descripcion, diagnostico_necesidad, diagnostico_preocupacion").in("id", ids)
        : Promise.resolve({ data: [] as any[] }),
      instIds.length
        ? (supabase as any).from("institutions").select("id, name").in("id", instIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const sMap = new Map((studs || []).map((s: any) => [s.id, s]));
    const iMap = new Map((insts || []).map((i: any) => [i.id, i.name]));
    setRequests((reqs || []).map((r: any) => ({ ...r, student: sMap.get(r.estudiante_id), institution_name: iMap.get(r.institution_id) })));

    // assigned students from asignaciones
    const { data: asigns } = await (supabase as any)
      .from("asignaciones")
      .select("estudiante_id, profiles!asignaciones_estudiante_id_fkey (id, full_name, email, grade, grado)")
      .eq("docente_id", user.id);
    setAssigned((asigns || []).map((a: any) => a.profiles).filter(Boolean));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`solicitudes-jub-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "solicitudes_jubilado",
        filter: `docente_jubilado_id=eq.${user.id}`,
      }, () => load())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "asignaciones",
        filter: `docente_id=eq.${user.id}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const pending = requests.filter((r) => r.estado === "pendiente");

  const respond = async (r: Solicitud, accept: boolean) => {
    const newState = accept ? "aceptada" : "rechazada";
    const { error: upErr } = await (supabase as any)
      .from("solicitudes_jubilado")
      .update({ estado: newState, visto: true })
      .eq("id", r.id);
    if (upErr) {
      toast({ title: "Error", description: upErr.message, variant: "destructive" });
      return;
    }
    if (accept && user) {
      const { error: insErr } = await (supabase as any).from("asignaciones").insert({
        estudiante_id: r.estudiante_id,
        docente_id: user.id,
        institution_id: r.institution_id,
        creado_por: user.id,
      });
      if (insErr && !String(insErr.message).includes("duplicate")) {
        toast({ title: "Error al asignar", description: insErr.message, variant: "destructive" });
        return;
      }
      toast({ title: "✅ Estudiante aceptado", description: "Ya aparece en tus estudiantes asignados." });
    } else {
      toast({ title: "Solicitud rechazada" });
    }
    load();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="w-4 h-4 mr-2" />
            Solicitudes
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full text-[10px] w-5 h-5 flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>🔔 Solicitudes de asignación</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {requests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No tienes solicitudes.</p>
            )}
            {requests.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border border-border bg-card/40 space-y-2">
                <p className="text-sm">
                  La institución <strong>{r.institution_name || "—"}</strong> quiere asignarte al estudiante <strong>{r.student?.full_name || "—"}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">{new Date(r.creado_en).toLocaleString()}</p>
                {r.estado !== "pendiente" && (
                  <Badge variant={r.estado === "aceptada" ? "default" : "outline"}>{r.estado}</Badge>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="ghost" onClick={() => setViewStudent(r.student)}>
                    <Eye className="w-3 h-3 mr-1" /> Ver perfil
                  </Button>
                  {r.estado === "pendiente" && (
                    <>
                      <Button size="sm" onClick={() => respond(r, true)}>
                        <Check className="w-3 h-3 mr-1" /> ✅ Aceptar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respond(r, false)}>
                        <X className="w-3 h-3 mr-1" /> ❌ Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" /> Mis Estudiantes Asignados ({assigned.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aún no tienes estudiantes asignados. Cuando una institución te envíe una solicitud y la aceptes, aparecerá aquí.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="text-left text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Correo</th>
                    <th className="py-2 pr-3">Grado</th>
                    <th className="py-2 pr-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {assigned.map((s) => (
                    <tr key={s.id} className="border-b border-border/40">
                      <td className="py-2 pr-3 font-medium">{s.full_name}</td>
                      <td className="py-2 pr-3">{s.email}</td>
                      <td className="py-2 pr-3">{s.grado || s.grade || "—"}</td>
                      <td className="py-2 pr-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setViewStudent(s)}>
                          <Eye className="w-3 h-3 mr-1" /> Ver acompañamiento
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewStudent} onOpenChange={(o) => !o && setViewStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewStudent?.full_name}</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-2 text-sm">
              <p><strong>Correo:</strong> {viewStudent.email || "—"}</p>
              <p><strong>Grado:</strong> {viewStudent.grado || viewStudent.grade || "—"}</p>
              {viewStudent.diagnostico_intereses && (
                <p><strong>Intereses:</strong> {(viewStudent.diagnostico_intereses || []).join(", ") || "—"}</p>
              )}
              {viewStudent.diagnostico_descripcion && (
                <p><strong>Descripción:</strong> {viewStudent.diagnostico_descripcion}</p>
              )}
              {viewStudent.diagnostico_necesidad && (
                <p><strong>Necesidad:</strong> {viewStudent.diagnostico_necesidad}</p>
              )}
              {viewStudent.diagnostico_preocupacion && (
                <p><strong>Preocupación:</strong> {viewStudent.diagnostico_preocupacion}</p>
              )}
              <p className="text-primary mt-3">Este estudiante espera tu apoyo 💜</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}