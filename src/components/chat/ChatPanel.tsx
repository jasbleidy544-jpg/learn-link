import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; is_read: boolean };

interface Props {
  peerId: string;
  peerName: string;
  /** If teacher is sending — also push a notification to the student */
  notifyStudent?: boolean;
}

export default function ChatPanel({ peerId, peerName, notifyStudent }: Props) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages(data || []);
    // mark as read
    await (supabase as any).from("chat_messages")
      .update({ is_read: true })
      .eq("recipient_id", user.id).eq("sender_id", peerId).eq("is_read", false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, peerId]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`chat-${user.id}-${peerId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const m = payload.new as Msg;
          if ((m.sender_id === user.id && m.recipient_id === peerId) ||
              (m.sender_id === peerId && m.recipient_id === user.id)) {
            setMessages((arr) => [...arr, m]);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, peerId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    const body = text.trim();
    const { error } = await (supabase as any).from("chat_messages").insert({
      sender_id: user.id, recipient_id: peerId, body,
    });
    if (error) { toast.error("No se pudo enviar el mensaje"); setSending(false); return; }
    if (notifyStudent) {
      await (supabase as any).from("student_notifications").insert({
        student_id: peerId, sender_id: user.id, type: "message",
        title: `Nuevo mensaje de ${profile?.full_name || "tu docente"}`,
        body: body.slice(0, 140),
      });
    }
    setText("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[420px]">
      <div className="px-3 py-2 border-b text-sm font-medium">Chat con {peerName}</div>
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Aún no hay mensajes. Inicia la conversación.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-2 border-t flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <Button onClick={send} disabled={sending || !text.trim()} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}