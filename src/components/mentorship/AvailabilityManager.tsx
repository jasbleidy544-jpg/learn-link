import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Block = { id: string; day_of_week: number; start_time: string; end_time: string };

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

function fmt(t: string) {
  // "15:00:00" -> "3:00 p. m."
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

interface Props {
  /** Interfaz más simple y con letras grandes, pensada para docentes jubilados. */
  simple?: boolean;
}

export default function AvailabilityManager({ simple = false }: Props) {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [start, setStart] = useState("15:00");
  const [end, setEnd] = useState("17:00");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("mentor_availability")
      .select("id, day_of_week, start_time, end_time")
      .eq("mentor_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    setBlocks(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const addBlock = async (day: number) => {
    if (!user) return;
    if (!start || !end || start >= end) {
      toast.error("La hora de fin debe ser posterior a la de inicio.");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("mentor_availability").insert({
      mentor_id: user.id,
      day_of_week: day,
      start_time: start,
      end_time: end,
    });
    setSaving(false);
    if (error) { toast.error("No se pudo agregar el bloque: " + error.message); return; }
    toast.success("Bloque de disponibilidad agregado.");
    setAddingDay(null);
    load();
  };

  const removeBlock = async (id: string) => {
    const { error } = await (supabase as any).from("mentor_availability").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Bloque eliminado.");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando tu disponibilidad...
      </div>
    );
  }

  return (
    <Card className="cloud-card glow-effect">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${simple ? "text-xl" : ""}`}>
          <CalendarClock className="w-5 h-5 text-primary" /> Mi Agenda — Bloques disponibles
        </CardTitle>
        <p className={`text-muted-foreground ${simple ? "text-base" : "text-sm"}`}>
          Marca los días y horas en los que puedes atender mentorías. Los estudiantes solo podrán
          agendar dentro de estos horarios.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((d) => {
            const dayBlocks = blocks.filter((b) => b.day_of_week === d.value);
            return (
              <div key={d.value} className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                <h4 className={`font-semibold ${simple ? "text-lg" : "text-sm"}`}>{d.label}</h4>
                <div className="flex flex-wrap gap-2">
                  {dayBlocks.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sin bloques este día.</p>
                  )}
                  {dayBlocks.map((b) => (
                    <Badge
                      key={b.id}
                      variant="secondary"
                      className={`gap-1.5 ${simple ? "text-base py-1.5 px-3" : ""}`}
                    >
                      {fmt(b.start_time)} – {fmt(b.end_time)}
                      <button onClick={() => removeBlock(b.id)} className="ml-1 hover:text-red-500" aria-label="Eliminar bloque">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {addingDay === d.value ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={simple ? "text-base h-11" : ""} />
                      <span className="text-muted-foreground">a</span>
                      <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={simple ? "text-base h-11" : ""} />
                    </div>
                    <div className="flex gap-2">
                      <Button size={simple ? "default" : "sm"} onClick={() => addBlock(d.value)} disabled={saving} className="flex-1">
                        {saving ? "Guardando..." : "Confirmar"}
                      </Button>
                      <Button size={simple ? "default" : "sm"} variant="ghost" onClick={() => setAddingDay(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size={simple ? "default" : "sm"}
                    variant="outline"
                    className={`w-full ${simple ? "h-11 text-base" : ""}`}
                    onClick={() => { setAddingDay(d.value); setStart("15:00"); setEnd("17:00"); }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Agregar bloque
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
