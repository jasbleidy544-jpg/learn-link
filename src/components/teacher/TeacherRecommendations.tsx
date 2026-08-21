import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Rec = { id: string; title: string; content: string; priority: string; student_id: string; student_name?: string };

type Props = { scope?: "institution" | "assigned"; title?: string };

export default function TeacherRecommendations({ scope = "institution", title = "Recomendaciones de la IA" }: Props) {
  const { user, profile } = useAuth();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      let pq = (supabase as any).from("profiles").select("id, full_name");
      if (scope === "assigned") pq = pq.eq("assigned_teacher_id", user.id);
      else if (profile?.institution) pq = pq.eq("institution", profile.institution);
      else { setLoading(false); return; }
      const { data: students } = await pq;
      const map = new Map((students || []).map((s: any) => [s.id, s.full_name]));
      const ids = Array.from(map.keys()) as string[];
      if (!ids.length) { setRecs([]); setLoading(false); return; }
      const { data } = await (supabase as any)
        .from("ai_recommendations").select("id,title,content,priority,student_id")
        .in("student_id", ids).order("generated_at", { ascending: false }).limit(10);
      setRecs(((data as any[]) || []).map((r) => ({ ...r, student_name: map.get(r.student_id) as string })));
      setLoading(false);
    })();
  }, [user, profile, scope]);

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!loading && recs.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay recomendaciones recientes.</p>}
        {recs.map((r) => (
          <div key={r.id} className="p-3 rounded-md border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm">{r.title}</h4>
              <Badge variant={r.priority === "high" ? "destructive" : r.priority === "low" ? "outline" : "secondary"}>{r.priority}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{r.student_name}</p>
            <p className="text-sm">{r.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
