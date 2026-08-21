import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Copy, CalendarCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Meeting = {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  meet_link: string | null;
  status: string;
  recordatorio_24h?: boolean;
  recordatorio_1h?: boolean;
  teacher_name?: string;
};

const openMeet = (link: string | null) => {
  if (!link) return;
  window.open(link, "_blank", "noopener,noreferrer");
};
const copyMeet = async (link: string | null) => {
  if (!link) return;
  await navigator.clipboard.writeText(link);
  toast.success("Link copiado al portapapeles");
};

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function formatCountdown(diffMs: number) {
  if (diffMs <= 0) return "Sesión en curso";
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (days > 0) return `Faltan ${days}d ${hours}h`;
  if (hours > 0) return `Faltan ${hours}h ${minutes}m`;
  return `Faltan ${minutes} min`;
}

export default function MyMentorshipsStudentCard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const now = useNow(30000);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("meetings")
      .select("id, host_id, title, description, scheduled_at, meet_link, status, recordatorio_24h, recordatorio_1h")
      .eq("student_id", user.id)
      .order("scheduled_at", { ascending: true });
    const list = (data || []) as Meeting[];
    const ids = Array.from(new Set(list.map((m) => m.host_id))).filter(Boolean);
    if (ids.length) {
      const { data: profs } = await (supabase as any)
        .from("profiles").select("id, full_name").in("id", ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p.full_name]));
      list.forEach((m) => { m.teacher_name = (map.get(m.host_id) as string) || "Tu docente"; });
    }
    setItems(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`student-mentorships-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "meetings", filter: `student_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Frontend fallback for automatic reminders
  useEffect(() => {
    if (!user || items.length === 0) return;
    (async () => {
      for (const m of items) {
        if (!m.meet_link || m.status !== "scheduled") continue;
        const diffMs = new Date(m.scheduled_at).getTime() - Date.now();
        const hours = diffMs / 3600000;
        const minutes = diffMs / 60000;
        const teacher = m.teacher_name || "tu docente";
        const when = new Date(m.scheduled_at).toLocaleString();
        if (!m.recordatorio_24h && hours >= 23 && hours <= 25) {
          await (supabase as any).from("student_notifications").insert({
            student_id: user.id, sender_id: m.host_id, type: "meeting",
            title: "⏰ Mentoría mañana",
            message: `Recuerda que mañana tienes una sesión con ${teacher}: "${m.title}".`,
            body: `Recuerda que mañana (${when}) tienes una sesión con ${teacher}: "${m.title}". ¡No lo olvides!`,
            link: m.meet_link,
          });
          await (supabase as any).from("meetings").update({ recordatorio_24h: true }).eq("id", m.id);
        }
        if (!m.recordatorio_1h && minutes >= 55 && minutes <= 65) {
          await (supabase as any).from("student_notifications").insert({
            student_id: user.id, sender_id: m.host_id, type: "meeting",
            title: "🔴 Tu mentoría es en 1 hora",
            message: `En menos de una hora tienes sesión con ${teacher}: "${m.title}".`,
            body: `En menos de una hora tienes sesión con ${teacher}: "${m.title}". ¡Prepárate!`,
            link: m.meet_link,
          });
          await (supabase as any).from("meetings").update({ recordatorio_1h: true }).eq("id", m.id);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, user, now]);

  const { upcoming, past } = useMemo(() => {
    const up: Meeting[] = []; const pa: Meeting[] = [];
    for (const m of items) {
      const t = new Date(m.scheduled_at).getTime();
      const ended = t + 30 * 60000 < now.getTime(); // 30 min después se considera completada
      if (m.status === "scheduled" && !ended) up.push(m);
      else pa.push(m);
    }
    return { upcoming: up, past: pa.reverse() };
  }, [items, now]);

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary" /> Mis Mentorías 📅
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no tienes mentorías agendadas. Cuando un docente programe una sesión contigo, aparecerá aquí.
          </p>
        ) : (
          <>
            <section>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Próximas ({upcoming.length})
              </h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin mentorías próximas.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {upcoming.map((m) => {
                    const dt = new Date(m.scheduled_at);
                    const diffMs = dt.getTime() - now.getTime();
                    const imminent = diffMs <= 30 * 60000;
                    return (
                      <div
                        key={m.id}
                        className={[
                          "rounded-xl border-2 p-4 bg-card/60 backdrop-blur transition",
                          imminent
                            ? "border-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                            : "border-primary animate-pulse shadow-[0_0_18px_hsl(var(--primary)/0.35)]",
                        ].join(" ")}
                      >
                        <div className="space-y-1">
                          <p className="font-semibold flex items-center gap-2">📅 {m.title}</p>
                          <p className="text-sm">👨‍🏫 {m.teacher_name}</p>
                          <p className="text-sm">📆 {dt.toLocaleDateString()} a las {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          <p className={`text-sm font-medium flex items-center gap-1 ${imminent ? "text-red-500" : "text-primary"}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {imminent ? "¡La reunión está por comenzar! 🔴" : formatCountdown(diffMs)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            size={imminent ? "default" : "sm"}
                            className={imminent ? "flex-1 bg-red-500 hover:bg-red-600 text-white font-bold" : "flex-1"}
                            onClick={() => openMeet(m.meet_link)}
                            disabled={!m.meet_link}
                          >
                            <Video className="w-4 h-4 mr-1" />
                            {imminent ? "Unirse ahora" : "Unirse a la sesión"} 🎥
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => copyMeet(m.meet_link)} disabled={!m.meet_link}>
                            <Copy className="w-4 h-4 mr-1" /> Copiar 📋
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                Anteriores ({past.length})
              </h3>
              {past.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no tienes mentorías anteriores.</p>
              ) : (
                <div className="space-y-2">
                  {past.map((m) => {
                    const dt = new Date(m.scheduled_at);
                    return (
                      <div key={m.id} className="rounded-lg border border-border/60 p-3 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
                        <div className="min-w-0">
                          <p className="font-medium truncate">📅 {m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.teacher_name} · {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-green-600">
                          {m.status === "cancelled" ? "Cancelada" : "Completada ✓"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}