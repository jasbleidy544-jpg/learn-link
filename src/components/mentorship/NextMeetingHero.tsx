import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, Copy, Clock } from "lucide-react";
import { toast } from "sonner";

type Props = {
  title: string;
  counterpartLabel: string;
  counterpartName: string;
  scheduledAt: string;
  meetLink: string | null;
  /** "large" para jubilados: letras y botones aún más grandes. */
  size?: "default" | "large";
};

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function formatCountdownWords(diffMs: number) {
  if (diffMs <= 0) return "La sesión ya comenzó";
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} día${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hora${hours === 1 ? "" : "s"}`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} minuto${minutes === 1 ? "" : "s"}`);
  if (parts.length === 0) return "Menos de un minuto";
  return `Faltan ${parts.join(" y ")}`;
}

export default function NextMeetingHero({ title, counterpartLabel, counterpartName, scheduledAt, meetLink, size = "default" }: Props) {
  const now = useNow(1000);
  const dt = new Date(scheduledAt);
  const diffMs = dt.getTime() - now.getTime();
  // Botón grande habilitado desde 10 min antes hasta 60 min después de iniciar.
  const canJoin = diffMs <= 10 * 60000 && diffMs > -60 * 60000;
  const isLarge = size === "large";

  const openMeet = () => {
    if (!meetLink) return;
    window.open(meetLink, "_blank", "noopener,noreferrer");
  };
  const copyMeet = async () => {
    if (!meetLink) return;
    await navigator.clipboard.writeText(meetLink);
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <div
      className={[
        "rounded-2xl border-2 p-5 bg-card/70 backdrop-blur space-y-3",
        canJoin
          ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.45)] animate-pulse"
          : "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
      ].join(" ")}
    >
      <div>
        <p className={isLarge ? "text-sm text-muted-foreground" : "text-xs text-muted-foreground uppercase tracking-wide"}>
          Próxima reunión
        </p>
        <h3 className={isLarge ? "text-2xl font-bold" : "text-lg font-bold"}>{title}</h3>
        <p className={isLarge ? "text-lg" : "text-sm text-muted-foreground"}>
          {counterpartLabel}: <span className="font-medium text-foreground">{counterpartName}</span>
        </p>
        <p className={isLarge ? "text-lg" : "text-sm text-muted-foreground"}>
          📆 {dt.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })} · {dt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className={`flex items-center gap-2 font-semibold ${canJoin ? "text-green-400" : "text-primary"} ${isLarge ? "text-xl" : "text-base"}`}>
        <Clock className={isLarge ? "w-6 h-6" : "w-4 h-4"} />
        {canJoin ? "¡Es hora de tu reunión! 🎉" : formatCountdownWords(diffMs)}
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          onClick={openMeet}
          disabled={!meetLink}
          className={[
            canJoin ? "bg-green-500 hover:bg-green-600 text-white font-bold" : "",
            isLarge ? "h-16 text-xl px-8 flex-1" : canJoin ? "h-12 text-base px-6 flex-1" : "flex-1",
          ].join(" ")}
          size={isLarge || canJoin ? "lg" : "default"}
        >
          <Video className={isLarge ? "w-6 h-6 mr-2" : "w-4 h-4 mr-2"} />
          {canJoin ? "Unirse a la reunión" : "Ver enlace de la reunión"}
        </Button>
        <Button
          variant="outline"
          onClick={copyMeet}
          disabled={!meetLink}
          className={isLarge ? "h-16 text-lg px-6" : ""}
          size={isLarge ? "lg" : "default"}
        >
          <Copy className={isLarge ? "w-5 h-5 mr-2" : "w-4 h-4 mr-2"} /> Copiar enlace
        </Button>
      </div>
    </div>
  );
}
