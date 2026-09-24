import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Send, MessageSquare, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export default function StudentAIAssistant() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const aiName = profile?.nombre_ia || "abi";
  const studentName =
    profile?.apodo_estudiante || profile?.full_name?.split(" ")[0] || "estudiante";

  // Cargar conversaciones
  const loadConversations = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setConversations(data || []);
    if (data && data.length > 0 && !activeId) {
      setActiveId(data[0].id);
    }
  };

  // Cargar mensajes de la conversación activa
  const loadMessages = async (convId: string) => {
    const { data } = await (supabase as any)
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Crear nueva conversación
  const newConversation = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("conversations")
      .insert({ user_id: user.id, title: "Nueva conversación" })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setConversations((prev) => [data, ...prev]);
    setActiveId(data.id);
    setMessages([]);
  };

  // Eliminar conversación
  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await (supabase as any)
      .from("conversations")
      .delete()
      .eq("id", convId);
    if (error) return;
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeId === convId) {
      setActiveId(null);
      setMessages([]);
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (!input.trim() || !activeId || !user) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Guardar mensaje del usuario
    const { data: userMsg } = await (supabase as any)
      .from("messages")
      .insert({
        conversation_id: activeId,
        role: "user",
        content,
      })
      .select()
      .single();

    setMessages((prev) => [...prev, userMsg]);

    // Respuesta simulada de la IA (temporal, sin API key)
    setTimeout(async () => {
      const aiContent = `Hola ${studentName}, soy ${aiName}. Aún no tengo conexión con mi cerebro completo 🤖 pero pronto podré ayudarte con todas tus dudas de estudio.`;
      const { data: aiMsg } = await (supabase as any)
        .from("messages")
        .insert({
          conversation_id: activeId,
          role: "assistant",
          content: aiContent,
        })
        .select()
        .single();
      setMessages((prev) => [...prev, aiMsg]);
      setSending(false);

      // Actualizar updated_at de la conversación
      await (supabase as any)
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeId);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">🧠 Mi IA · {aiName}</h1>
        <p className="text-muted-foreground">
          Tu asistente personal de aprendizaje. Pregúntame lo que necesites.
        </p>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-220px)]">
        {/* Sidebar de conversaciones */}
        <Card className="cloud-card overflow-hidden">
          <div className="p-3 border-b">
            <Button onClick={newConversation} className="w-full gap-2" size="sm">
              <Plus className="w-4 h-4" /> Nuevo chat
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-57px)]">
            <div className="p-2 space-y-1">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sin conversaciones
                </p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`group flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                    activeId === c.id
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-accent/20"
                  }`}
                >
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat */}
        <Card className="cloud-card flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-3">🤖</div>
                <p className="text-muted-foreground">
                  Hola {studentName}, soy {aiName}. ¿En qué te ayudo hoy?
                </p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2 text-sm">
                  {aiName} está escribiendo...
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={`Pregúntale algo a ${aiName}...`}
              disabled={!activeId || sending}
            />
            <Button onClick={sendMessage} disabled={!input.trim() || sending} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}