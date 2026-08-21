import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type StudentLite = { id: string; full_name: string; grade: string | null };

/** Estudiantes asignados al docente activo (tabla asignaciones). */
export function useAssignedStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: asigs } = await (supabase as any)
      .from("asignaciones")
      .select("estudiante_id")
      .eq("docente_id", user.id);
    const ids = Array.from(new Set((asigs || []).map((a: any) => a.estudiante_id)));
    if (ids.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }
    const { data: profs } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, grade")
      .in("id", ids);
    setStudents((profs || []) as StudentLite[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { students, loading, reload: load };
}

export const PRIORIDADES = ["alta", "media", "baja"] as const;

export const MOTIVOS_ALERTA = [
  "Baja participación",
  "Ausencias frecuentes",
  "Dificultades académicas",
  "Desmotivación",
  "Posible riesgo de abandono",
];

export const AREAS = ["Orientación", "Coordinación", "Bienestar"];

export const ESTADOS_ALERTA = ["pendiente", "en seguimiento", "atendido", "cerrado"];

export const estadoVariant = (estado: string) => {
  switch (estado) {
    case "pendiente": return "destructive" as const;
    case "en seguimiento": return "secondary" as const;
    case "atendido": return "default" as const;
    default: return "outline" as const;
  }
};

export const prioridadClass = (p: string) =>
  p === "alta"
    ? "border-red-500/40 text-red-400"
    : p === "media"
    ? "border-orange-500/40 text-orange-400"
    : "border-emerald-500/40 text-emerald-400";

export const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });