import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Student = { id: string; full_name: string; email: string | null };

const MATERIAS = ["Matemáticas", "Física", "Castellano", "Química", "Arte", "Religión", "Filosofía", "Inglés"];
const DIFICULTADES = [
  { value: "basico", label: "🟢 Básico", level: "fácil" },
  { value: "intermedio", label: "🟡 Intermedio", level: "medio" },
  { value: "avanzado", label: "🔴 Avanzado", level: "difícil" },
];
const COUNTS = [5, 10, 15];

interface Props { scope?: "institution" | "assigned" }
export default function CreateActivityDialog({ scope = "assigned" }: Props = {}) {
  void scope;
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [materia, setMateria] = useState("Matemáticas");
  const [tema, setTema] = useState("");
  const [dificultad, setDificultad] = useState<"basico"|"intermedio"|"avanzado">("intermedio");
  const [numPreguntas, setNumPreguntas] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      setLoadingStudents(true);
      const { data, error } = await (supabase as any)
        .from("asignaciones")
        .select("estudiante_id, profiles!asignaciones_estudiante_id_fkey(id, full_name, email)")
        .eq("docente_id", user.id);
      if (error) {
        toast.error("No se pudieron cargar tus estudiantes: " + error.message);
        setStudents([]);
      } else {
        const list: Student[] = (data || [])
          .map((r: any) => r.profiles)
          .filter(Boolean);
        setStudents(list);
      }
      setLoadingStudents(false);
    })();
  }, [open, user]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => prev.size === students.length ? new Set() : new Set(students.map(s => s.id)));
  };

  const submit = async () => {
    if (!user || selected.size === 0) return;
    setLoading(true);
    try {
      const dif = DIFICULTADES.find(d => d.value === dificultad)!;
      const { data: aiData, error: aiErr } = await supabase.functions.invoke("adaptive-question", {
        body: { area: materia.toLowerCase(), level: dif.level, tema, count: numPreguntas },
      });
      if (aiErr) throw aiErr;
      const questions = aiData?.questions ?? [];
      if (!questions.length) throw new Error("La IA no devolvió preguntas");
      const titulo = aiData?.title ?? `Actividad ICFES de ${materia}${tema ? ` — ${tema}` : ""}`;

      const { data: act, error: insErr } = await (supabase as any).from("actividades").insert({
        titulo,
        materia,
        tema: tema || null,
        dificultad,
        preguntas: questions,
        num_preguntas: numPreguntas,
        docente_id: user.id,
        docente_nombre: profile?.full_name || user.email,
        institution_id: profile?.institution_id || null,
        estado: "activa",
      }).select("id").single();
      if (insErr) throw insErr;

      const rows = Array.from(selected).map((sid) => ({
        actividad_id: act.id,
        estudiante_id: sid,
      }));
      const { error: aeErr } = await (supabase as any).from("actividades_estudiantes").insert(rows);
      if (aeErr) throw aeErr;

      toast.success(`✓ Actividad enviada a ${rows.length} estudiante(s)`);
      setOpen(false);
      setSelected(new Set());
      setTema("");
    } catch (e: any) {
      const msg = e?.message?.includes("Rate") ? "Demasiadas peticiones, intenta luego."
        : e?.message?.includes("Payment") ? "Sin créditos para la IA."
        : e?.message ?? "No se pudo crear la actividad";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-16 flex flex-col gap-2 w-full">
          <BookOpen className="w-5 h-5" /> Crear actividad ICFES
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear actividad tipo ICFES con IA</DialogTitle>
          <DialogDescription>Selecciona estudiantes, materia, tema y dificultad. La IA generará las preguntas.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Estudiantes asignados</Label>
              {students.length > 0 && (
                <button type="button" onClick={toggleAll} className="text-xs text-primary hover:underline">
                  {selected.size === students.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              )}
            </div>
            <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y">
              {loadingStudents ? (
                <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                </div>
              ) : students.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No tienes estudiantes asignados aún. Contacta a tu institución.
                </div>
              ) : (
                students.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.full_name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{selected.size} seleccionado(s)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Materia</Label>
              <Select value={materia} onValueChange={setMateria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MATERIAS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>N° de preguntas</Label>
              <Select value={String(numPreguntas)} onValueChange={(v) => setNumPreguntas(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTS.map(c => <SelectItem key={c} value={String(c)}>{c} preguntas</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tema específico</Label>
            <Input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ejemplo: fracciones, ecuaciones, comprensión lectora, movimiento rectilíneo..."
            />
          </div>

          <div>
            <Label>Dificultad</Label>
            <Select value={dificultad} onValueChange={(v) => setDificultad(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFICULTADES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={selected.size === 0 || loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generando...</> : `Generar y enviar (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}