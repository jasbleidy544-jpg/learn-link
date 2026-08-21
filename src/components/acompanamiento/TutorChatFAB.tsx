import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export default function TutorChatFAB({ subject }: { subject: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("subject-tutor-chat", {
        body: { subject, messages: next },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data?.respuesta || "..." }]);
    } catch (e: any) {
      toast.error(e?.message || "El tutor no pudo responder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg shadow-primary/40 h-14 px-5 bg-gradient-to-r from-primary to-purple-500"
          size="lg"
        >
          <Bot className="w-5 h-5 mr-2" /> Pregúntale a tu Tutor IA 🤖
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Tutor IA — {subject}
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">
            Pregunta lo que quieras. Sin juicio, con ejemplos del día a día.
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border bg-muted/20">
              💡 Ejemplos: "no entiendo las fracciones", "explícame qué es la fotosíntesis", "ayúdame con esta tarea..."
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "user" ? (
                <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
              )}
            </div>
          ))}
          {loading && (
            <p className="text-sm text-muted-foreground italic flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Pensando...
            </p>
          )}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-border flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escribe tu duda..."
            rows={2}
            className="resize-none"
          />
          <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="h-auto">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}