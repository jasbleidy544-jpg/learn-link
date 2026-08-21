import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Video, BookOpen, MessageCircle, CheckCheck, Brain, Heart, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Notif = {
  id: string; type: string; title: string;
  body: string | null; link: string | null;
  is_read: boolean; created_at: string;
};

type Reco = {
  id: string; type: string; title: string; content: string;
  priority: string; is_read: boolean; generated_at: string;
};

const ICONS: Record<string, any> = { meeting: Video, activity: BookOpen, message: MessageCircle };
const RECO_ICONS: Record<string, any> = {
  academic: Brain, motivational: Heart, improvement: TrendingUp,
  risk_alert: AlertTriangle,
};

export default function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [recos, setRecos] = useState<Reco[]>([]);

  const load = async () => {
    if (!user) return;
    const [{ data: notifs }, { data: recsData }] = await Promise.all([
      (supabase as any).from("student_notifications")
        .select("*").eq("student_id", user.id)
        .order("created_at", { ascending: false }).limit(20),
      (supabase as any).from("ai_recommendations")
        .select("*").eq("student_id", user.id)
        .order("generated_at", { ascending: false }).limit(20),
    ]);
    setItems(notifs || []);
    setRecos(recsData || []);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("nb-notifications")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "student_notifications", filter: `student_id=eq.${user.id}` },
        (payload) => setItems((arr) => [payload.new as Notif, ...arr]))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_recommendations", filter: `student_id=eq.${user.id}` },
        (payload) => setRecos((arr) => [payload.new as Reco, ...arr]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markRead = async (id: string) => {
    await (supabase as any).from("student_notifications").update({ is_read: true }).eq("id", id);
    setItems((arr) => arr.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markRecoRead = async (id: string) => {
    await (supabase as any).from("ai_recommendations").update({ is_read: true }).eq("id", id);
    setRecos((arr) => arr.map((r) => r.id === id ? { ...r, is_read: true } : r));
  };

  const markAll = async () => {
    if (!user) return;
    await Promise.all([
      (supabase as any).from("student_notifications")
        .update({ is_read: true }).eq("student_id", user.id).eq("is_read", false),
      (supabase as any).from("ai_recommendations")
        .update({ is_read: true }).eq("student_id", user.id).eq("is_read", false),
    ]);
    setItems((arr) => arr.map((n) => ({ ...n, is_read: true })));
    setRecos((arr) => arr.map((r) => ({ ...r, is_read: true })));
  };

  const unread = items.filter((n) => !n.is_read).length + recos.filter((r) => !r.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-10 w-10 rounded-full" aria-label="Notificaciones">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Bell className="w-4 h-4 text-primary" /> Notificaciones
            {unread > 0 && <Badge>{unread}</Badge>}
          </div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAll}>
              <CheckCheck className="w-4 h-4 mr-1" /> Marcar leídas
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-2 space-y-2">
          {items.length === 0 && recos.length === 0 && (
            <p className="text-sm text-muted-foreground p-3">No tienes notificaciones aún.</p>
          )}
          {recos.map((r) => {
            const Icon = RECO_ICONS[r.type] ?? Sparkles;
            return (
              <div key={r.id} className={`p-3 rounded-lg border flex items-start gap-3 ${r.is_read ? "opacity-60" : "border-primary/40 bg-primary/5"}`}>
                <Icon className="w-4 h-4 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{r.title}</h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{r.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(r.generated_at).toLocaleString()}</p>
                </div>
                {!r.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => markRecoRead(r.id)}>Leído</Button>
                )}
              </div>
            );
          })}
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <div key={n.id} className={`p-3 rounded-lg border flex items-start gap-3 ${n.is_read ? "opacity-60" : "border-primary/40 bg-primary/5"}`}>
                <Icon className="w-4 h-4 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{n.title}</h4>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  {n.link && (
                    <button
                      type="button"
                      onClick={() => window.open(n.link as string, "_blank", "noopener,noreferrer")}
                      className="text-xs text-primary underline text-left"
                    >
                      Abrir enlace
                    </button>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Leído</Button>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}