import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, HeartHandshake, Clock } from "lucide-react";

type Teacher = { id: string; full_name: string; subjects: string | null; email: string | null };

export default function AssignedTeachersCard() {
  const { user, profile } = useAuth();
  const [active, setActive] = useState<Teacher | null>(null);
  const [mentor, setMentor] = useState<Teacher | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      const ids = [profile.assigned_teacher_id, profile.mentor_id].filter(Boolean) as string[];
      if (ids.length) {
        const { data } = await (supabase as any)
          .from("profiles")
          .select("id, full_name, subjects, email")
          .in("id", ids);
        const map = new Map((data || []).map((t: any) => [t.id, t]));
        if (profile.assigned_teacher_id) setActive(map.get(profile.assigned_teacher_id) as Teacher || null);
        if (profile.mentor_id) setMentor(map.get(profile.mentor_id) as Teacher || null);
      }
      if (!profile.mentor_id) {
        const { count } = await (supabase as any)
          .from("mentor_requests")
          .select("id", { count: "exact", head: true })
          .eq("student_id", user.id)
          .eq("status", "pending");
        setPendingCount(count || 0);
      }
    })();
  }, [user, profile]);

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" /> Mis docentes asignados
        </CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card/40">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h4 className="font-semibold">Docente activo</h4>
          </div>
          {active ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">{active.full_name}</p>
              {active.subjects && <p className="text-muted-foreground">{active.subjects}</p>}
              {active.email && <p className="text-xs text-muted-foreground">✉️ {active.email}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {profile?.institution_id ? "Por asignar" : "Vincúlate a una institución para recibir un docente."}
            </p>
          )}
        </div>
        <div className="p-4 rounded-lg border border-border bg-card/40">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake className="w-4 h-4 text-pink-400" />
            <h4 className="font-semibold">Mentor jubilado</h4>
          </div>
          {mentor ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">{mentor.full_name}</p>
              {mentor.email && <p className="text-xs text-muted-foreground">✉️ {mentor.email}</p>}
              <Badge variant="secondary" className="mt-1">Mentor confirmado</Badge>
            </div>
          ) : pendingCount > 0 ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Esperando respuesta de {pendingCount} mentor{pendingCount > 1 ? "es" : ""}…
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin mentor asignado todavía.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}