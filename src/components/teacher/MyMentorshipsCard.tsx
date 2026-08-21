import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Copy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Meeting = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  meet_link: string | null;
  status: string;
  student_name?: string;
};

export default function MyMentorshipsCard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: meetings } = await (supabase as any)
      .from("meetings")
      .select("id, student_id, title, description, scheduled_at, meet_link, status")
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

  return (
    <Card className="cloud-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Mis Mentorías ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no has agendado mentorías. Usa "Agendar mentoría" para crear la primera.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}