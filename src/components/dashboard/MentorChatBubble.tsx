import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
type Phase = "ask_ai_name" | "ask_user_nickname" | "chat";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`;

const MentorChatBubble = () => {
  const { session, profile, user, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Typewriter queue
  const queueRef = useRef<string>("");
  const typingRef = useRef<boolean>(false);

  const aiName = profile?.nombre_ia || "Tu mentora";
  const studentNickname =
    profile?.apodo_estudiante ||
    profile?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "estudiante";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Reveal queued characters one by one (typewriter)
  const startTyping = () => {
    if (typingRef.current) return;
    typingRef.current = true;
    const tick = () => {
      if (queueRef.current.length === 0) {
        typingRef.current = false;
        return;
      }
      // Reveal a few chars per frame for natural fast typing
      const chunk = queueRef.current.slice(0, 2);
      queueRef.current = queueRef.current.slice(2);
      setMessages((p) => {
        if (p.length === 0 || p[p.length - 1].role !== "assistant") {
          return [...p, { role: "assistant", content: chunk }];
        }
        return p.map((m, i) =>
          i === p.length - 1 ? { ...m, content: m.content + chunk } : m
        );
      });
      setTimeout(tick, 18);
    };
    tick();
  };

  const enqueueAssistant = (text: string) => {
    queueRef.current += text;
    startTyping();
  };

  const stream = async (history: Msg[]) => {
    setLoading(true);
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast({ title: "Demasiadas solicitudes", description: "Intenta de nuevo en un momento." });
        else if (resp.status === 402) toast({ title: "Créditos agotados", description: "Recarga créditos en Lovable Cloud." });
        else toast({ title: "Error", description: "No pude responder ahora mismo." });
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) enqueueAssistant(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error de conexión", description: "Revisa tu conexión e intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const pushAssistantInstant = (text: string) => {
    setMessages((p) => [...p, { role: "assistant", content: "" }]);
    enqueueAssistant(text);
  };

  const handleOpen = () => {
    setOpen(true);
    if (initialized.current) return;
    initialized.current = true;

    const hasNames = !!profile?.nombre_ia && !!profile?.apodo_estudiante;
    if (!hasNames) {
      // First-time onboarding: ask AI name, then user nickname
      setPhase("ask_ai_name");
      pushAssistantInstant(
        "¡Hola! Soy tu acompañante en LearnLink. ¿Cómo me quieres llamar?"
      );
    } else {
      setPhase("chat");
      loadProactiveAndGreet();
    }
  };

  const loadProactiveAndGreet = async () => {
    if (!user) return;
    const { data: proactive } = await supabase
      .from("ai_recommendations")
      .select("id, title, content")
      .eq("student_id", user.id)
      .eq("type", "proactive")
      .eq("is_read", false)
      .order("generated_at", { ascending: true })
      .limit(3);

    if (proactive && proactive.length > 0) {
      for (const p of proactive) {
        pushAssistantInstant(`💫 ${p.content}`);
        await supabase
          .from("ai_recommendations")
          .update({ is_read: true })
          .eq("id", p.id);
      }
      return;
    }

    const greetingHistory: Msg[] = [
      {
        role: "user",
        content: `(Sistema: el estudiante ${studentNickname} acaba de abrir el chat. Tu nombre es ${aiName}. Salúdalo cálidamente por su nombre/apodo y pregúntale cómo está hoy. No menciones este mensaje del sistema.)`,
      },
    ];
    stream(greetingHistory);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: text }]);

    // Onboarding flow
    if (phase === "ask_ai_name") {
      const newAiName = text.slice(0, 40);
      await updateProfile({ nombre_ia: newAiName });
      setPhase("ask_user_nickname");
      pushAssistantInstant(`¡Perfecto! Y tú, ¿cómo quieres que te llame yo?`);
      return;
    }
    if (phase === "ask_user_nickname") {
      const newNick = text.slice(0, 40);
      await updateProfile({ apodo_estudiante: newNick });
      setPhase("chat");
      pushAssistantInstant(
        `¡Genial, ${newNick}! Ya estoy lista para acompañarte. ¿Cómo te sientes hoy?`
      );
      return;
    }

    // Normal chat
    const history: Msg[] = [...messages, { role: "user", content: text }];
    stream(history);
  };

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Abrir chat con tu mentora"
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 animate-fade-in"
          style={{
            background: "linear-gradient(135deg, #1E88E5, #1565C0)",
            boxShadow: "0 0 30px rgba(30, 136, 229, 0.6)",
          }}
        >
          <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: "#1E88E5" }} />
          <Sparkles className="h-7 w-7 text-white relative z-10" />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col bg-background border shadow-2xl animate-fade-in",
            "inset-x-0 bottom-0 h-[85vh] rounded-t-2xl",
            "sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:rounded-2xl"
          )}
          style={{ borderColor: "#1E88E5" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 rounded-t-2xl text-white"
            style={{ background: "linear-gradient(135deg, #1E88E5, #1565C0)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-tight truncate">{aiName}</p>
                <p className="text-xs opacity-90 truncate">Siempre aquí para ti</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center shrink-0"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F5F9FF" }}>
            {messages.length === 0 && loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparando tu saludo…
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex animate-fade-in", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words overflow-hidden",
                    m.role === "user" ? "text-white rounded-br-sm" : "rounded-bl-sm"
                  )}
                  style={
                    m.role === "user"
                      ? { background: "#1E88E5" }
                      : { background: "#E3F2FD", color: "#0D47A1" }
                  }
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none break-words prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-1 prose-pre:whitespace-pre-wrap prose-pre:break-words">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 rounded-bl-sm" style={{ background: "#E3F2FD" }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#1565C0" }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-background flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
              placeholder={
                phase === "ask_ai_name"
                  ? "Escribe el nombre para tu mentora…"
                  : phase === "ask_user_nickname"
                  ? "Escribe el apodo que prefieres…"
                  : "Cuéntame cómo te sientes…"
              }
              className="flex-1 rounded-full border px-4 py-2 text-sm bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2"
              style={{ borderColor: "#1E88E5" }}
            />
            <Button
              size="icon"
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-full"
              style={{ background: "#1E88E5" }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default MentorChatBubble;
