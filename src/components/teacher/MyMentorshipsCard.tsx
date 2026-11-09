import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Copy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NextMeetingHero from "@/components/mentorship/NextMeetingHero";
import SessionNotesDialog from "@/components/mentorship/SessionNotesDialog";
import { maybeSendMeetingReminder } from "@/lib/meetingReminders";

type Meeting = {
  id: string;
  host_id: string;
  student_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  meet_link: string | null;
  status: string;
  notes: string | null;
  recordatorio_15min?: boolean;
  student_name?: string;
};

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function MyMentorshipsCard() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const now = useNow(30000);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: meetings } = await (supabase as any)
      .from("meetings")
      .select("id, host_id, student_id, title, description, scheduled_at, meet_link, status, notes, recordatorio_15min")
      .eq("host_id", user.id)
      .order("scheduled_at", { ascending: true });
    const list = (meetings || []) as Meeting[];
    const ids = Array.from(new Set(list.map((m) => m.student_id))).filter(Boolean);
    if (ids.length > 0) {
      const { data: profs } = await (supabase as any)
        .from("profiles").select("id, full_name").in("id", ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p.full_name]));
      list.forEach((m) => { m.student_name = (map.get(m.student_id) as string) || "Estudiante"; });
    }
    setItems(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`my-mentorships-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetings", filter: `host_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // Recordatorio de "faltan 15 minutos" — avisa tanto al mentor como al estudiante.
  useEffect(() => {
    if (!user || items.length === 0) return;
    (async () => {
      for (const m of items) {
        if (!m.meet_link || m.status !== "scheduled" || m.recordatorio_15min) continue;
        const sent = await maybeSendMeetingReminder(
          m as any,
          m.student_name || "tu estudiante",
          profile?.full_name || "Tu mentor"
        );
        if (sent) load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, user, now]);

  const copyLink = async (link: string | null) => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };

  const openMeet = (link: string | null) => {
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const cancel = async (id: string) => {
    const { error } = await (supabase as any).from("meetings").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Mentoría cancelada"); load(); }
  };

  const statusBadge = (s: string) => {
    if (s === "cancelled") return <Badge variant="destructive">Cancelada</Badge>;
    if (s === "completed") return <Badge variant="secondary">Completada</Badge>;
    return <Badge>Programada</Badge>;
  };

  const nextMeeting = useMemo(() => {
    return items
      .filter((m) => m.status === "scheduled" && new Date(m.scheduled_at).getTime() + 30 * 60000 > now.getTime())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
  }, [items, now]);

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Mis Mentorías ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no has agendado mentorías. Marca tu disponibilidad en "Mi Agenda" para que tus
            estudiantes puedan reservar una sesión, o usa "Agendar mentoría" para crear la primera.
          </p>
        ) : (
          <>
            {nextMeeting && (
              <NextMeetingHero
                title={nextMeeting.title}
                counterpartLabel="Con"
                counterpartName={nextMeeting.student_name || "tu estudiante"}
                scheduledAt={nextMeeting.scheduled_at}
                meetLink={nextMeeting.meet_link}
              />
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 pr-3">Estudiante</th>
                    <th className="py-2 pr-3">Título</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Hora</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => {
                    const d = new Date(m.scheduled_at);
                    const diffMs = d.getTime() - Date.now();
                    const imminent = m.status === "scheduled" && diffMs <= 30 * 60000 && diffMs > -30 * 60000;
                    const isPastScheduled = m.status === "scheduled" && diffMs <= -30 * 60000;
                    return (
                      <tr key={m.id} className="border-b border-border/40 align-top">
                        <td className="py-2 pr-3 font-medium">{m.student_name}</td>
                        <td className="py-2 pr-3">{m.title}</td>
                        <td className="py-2 pr-3">{d.toLocaleDateString()}</td>
                        <td className="py-2 pr-3">{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-2 pr-3">{statusBadge(m.status)}</td>
                        <td className="py-2 pr-3">
                          <div className="flex flex-wrap gap-2">
                            {m.meet_link && m.status === "scheduled" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openMeet(m.meet_link)}
                                  className={imminent ? "bg-primary text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.6)] animate-pulse font-bold" : ""}
                                  variant={imminent ? "default" : "outline"}
                                >
                                  <Video className="w-3 h-3 mr-1" />
                                  {imminent ? "¡Unirse ahora! 🔴" : "Unirse a la sesión 🎥"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => copyLink(m.meet_link)}>
                                  <Copy className="w-3 h-3 mr-1" /> Copiar
                                </Button>
                              </>
                            )}
                            {m.status === "scheduled" && (
                              <Button size="sm" variant="ghost" onClick={() => cancel(m.id)}>
                                <X className="w-3 h-3 mr-1" /> Cancelar
                              </Button>
                            )}
                            {(isPastScheduled || m.status === "completed") && (
                              <SessionNotesDialog
                                meetingId={m.id}
                                studentName={m.student_name || "el estudiante"}
                                initialNotes={m.notes}
                                onSaved={load}
                                trigger={
                                  <Button size="sm" variant="outline">
                                    {m.notes ? "Ver / editar notas" : "Agregar notas"}
                                  </Button>
                                }
                              />
                            )}
                          </div>
                          {m.notes && m.status === "completed" && (
                            <p className="text-xs text-muted-foreground italic mt-1 max-w-xs">📝 {m.notes}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
