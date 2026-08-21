import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Video, BookOpen, MessageCircle, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<string, any> = { meeting: Video, activity: BookOpen, message: MessageCircle };

export default function NotificationsPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("student_notifications")
      .select("*").eq("student_id", user.id)
      .order("created_at", { ascending: false }).limit(15);
    setItems(data || []);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("student-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "student_notifications", filter: `student_id=eq.${user.id}` },
        (payload) => setItems((arr) => [payload.new as Notif, ...arr]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markRead = async (id: string) => {
    await (supabase as any).from("student_notifications").update({ is_read: true }).eq("id", id);
    setItems((arr) => arr.filter((n) => n.id !== id));
  };

  const markAll = async () => {
    if (!user) return;
    await (supabase as any).from("student_notifications").update({ is_read: true }).eq("student_id", user.id).eq("is_read", false);
    setItems([]);
  };

  const visible = items.filter((n) => !n.is_read);
  const unread = visible.length;

  return (
    <Card className="cloud-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" /> Notificaciones
          {unread > 0 && <Badge>{unread}</Badge>}
        </CardTitle>
        {unread > 0 && (
          <Button size="sm" variant="ghost" onClick={markAll}>
            <CheckCheck className="w-4 h-4 mr-1" /> Marcar leídas
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 max-h-[28rem] overflow-y-auto">
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Todo al día por aquí 🎉</p>
        )}
        {visible.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <div key={n.id} className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/15">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base">{n.title}</h4>
                {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                {n.link && (
                  <a href={n.link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="mt-2">Abrir</Button>
                  </a>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Marcar leída</Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}