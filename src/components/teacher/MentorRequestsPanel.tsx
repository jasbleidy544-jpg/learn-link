import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HeartHandshake, Check, X, Users } from "lucide-react";
import { toast } from "sonner";

type Req = {
  id: string;
  student_id: string;
  status: string;
  created_at: string;
  student: { full_name: string; grade: string | null; institution: string | null } | null;
};

export default function MentorRequestsPanel() {
  const { user } = useAuth();
  const [pending, setPending] = useState<Req[]>([]);
  const [mentees, setMentees] = useState<{ id: string; full_name: string; grade: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: reqs } = await (supabase as any)
      .from("mentor_requests")
      .select("id, student_id, status, created_at")
      .eq("mentor_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    const ids = (reqs || []).map((r: any) => r.student_id);
    let studentsMap = new Map<string, any>();
    if (ids.length) {
      const { data: students } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, grade, institution")
        .in("id", ids);
      studentsMap = new Map((students || []).map((s: any) => [s.id, s]));
    }
    setPending((reqs || []).map((r: any) => ({ ...r, student: studentsMap.get(r.student_id) || null })));

    const { data: mine } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, grade")
      .eq("mentor_id", user.id);
    setMentees(mine || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const respond = async (id: string, accept: boolean) => {
    const { data, error } = await (supabase as any).rpc("respond_mentor_request", {
      _request_id: id,
      _accept: accept,
    });
    if (error) {
      toast.error("No se pudo procesar la solicitud");
      return;
    }
    if (data === "already_assigned") toast.message("Otro mentor ya aceptó a este estudiante.");
    else if (accept) toast.success("Estudiante vinculado como mentorado.");
    else toast.success("Solicitud rechazada.");
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-pink-400" /> Solicitudes de mentoría
            {pending.length > 0 && <Badge variant="destructive">{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!loading && pending.length === 0 && (
            <p className="text-sm text-muted-foreground">No tienes solicitudes pendientes.</p>
          )}
          {pending.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/40">
              <div>
                <p className="font-medium">{r.student?.full_name || "Estudiante"}</p>
                <p className="text-xs text-muted-foreground">
                  {r.student?.grade || "Sin grado"}{r.student?.institution ? ` · ${r.student.institution}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => respond(r.id, false)}>
                  <X className="w-4 h-4 mr-1" /> Rechazar
                </Button>
                <Button size="sm" onClick={() => respond(r.id, true)}>
                  <Check className="w-4 h-4 mr-1" /> Aceptar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Mis mentorados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mentees.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes mentorados.</p>}
          {mentees.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40">
              <div>
                <p className="font-medium">{m.full_name}</p>
                <p className="text-xs text-muted-foreground">{m.grade || "Sin grado"}</p>
              </div>
              <Badge variant="secondary">Mentor activo</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}