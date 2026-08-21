import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye } from "lucide-react";
import { exportToCSV } from "@/lib/adminAudit";

export type StudentRow = {
  id: string;
  full_name: string;
  email?: string;
  grade?: string;
  active_subjects: number;
  avg_level: number;
  avg_level_name: string;
  last_sign_in_at?: string | null;
  created_at?: string | null;
  institution_code?: string | null;
  progress: number;
  risk_level: "low" | "medium" | "high" | "unknown";
};

const RISK_LABEL: Record<string, { label: string; emoji: string; cls: string }> = {
  high: { label: "RIESGO ALTO", emoji: "🔴", cls: "bg-red-500/20 text-red-300 border-red-500/40" },
  medium: { label: "RIESGO MEDIO", emoji: "🟠", cls: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  low: { label: "RIESGO BAJO", emoji: "🟢", cls: "bg-green-500/20 text-green-300 border-green-500/40" },
  unknown: { label: "Sin datos", emoji: "⚪", cls: "bg-muted text-muted-foreground" },
};

function computeRiskFromActivity(row: StudentRow): StudentRow["risk_level"] {
  if (row.risk_level && row.risk_level !== "unknown") return row.risk_level;
  const ref = row.last_sign_in_at || row.created_at;
  if (!ref) return "unknown";
  const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  if (days > 7) return "high";
  if (days >= 3) return "medium";
  return "low";
}

interface Props {
  students: StudentRow[];
  onOpenDetail: (id: string) => void;
}

export default function StudentsTable({ students, onOpenDetail }: Props) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");

  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade).filter(Boolean))) as string[],
    [students]
  );

  const filtered = useMemo(() => {
    return students.map((s) => ({ ...s, risk_level: computeRiskFromActivity(s) })).filter((s) => {
      if (query) {
        const q = query.toLowerCase();
        if (!s.full_name?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q)) return false;
      }
      if (grade !== "all" && s.grade !== grade) return false;
      if (risk !== "all" && s.risk_level !== risk) return false;
      return true;
    });
  }, [students, query, grade, risk]);

  const handleExport = () => {
    exportToCSV(
      filtered.map((s) => ({
        Nombre: s.full_name,
        Email: s.email ?? "",
        "Fecha de registro": s.created_at ?? "",
        "Último acceso": s.last_sign_in_at ?? "",
        "Código institucional": s.institution_code ?? "",
        "Alerta IA": RISK_LABEL[s.risk_level].label,
      })),
      "estudiantes.csv"
    );
  };

  return (
    <Card className="cloud-card">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Estudiantes vinculados ({filtered.length})</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-48" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Grado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grados</SelectItem>
              {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Riesgo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="high">🔴 Alto</SelectItem>
              <SelectItem value="medium">🟠 Medio</SelectItem>
              <SelectItem value="low">🟢 Bajo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 pr-3">Nombre completo</th>
                <th className="py-2 pr-3">Correo electrónico</th>
                <th className="py-2 pr-3">Fecha de registro</th>
                <th className="py-2 pr-3">Último acceso</th>
                <th className="py-2 pr-3">Código institucional</th>
                <th className="py-2 pr-3">Alerta IA</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const r = RISK_LABEL[s.risk_level];
                return (
                  <tr key={s.id} className="border-b border-border/40 hover:bg-card/60">
                    <td className="py-2 pr-3 font-medium">{s.full_name}</td>
                    <td className="py-2 pr-3">{s.email || "—"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {s.last_sign_in_at ? new Date(s.last_sign_in_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {s.institution_code ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/40">
                          ✓ {s.institution_code}
                        </Badge>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className={r.cls}>{r.emoji} {r.label}</Badge>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => onOpenDetail(s.id)}>
                        <Eye className="w-4 h-4 mr-1" /> Ver detalle
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-6">
                    {students.length === 0
                      ? "Aún no hay estudiantes registrados con este código."
                      : "Sin estudiantes que coincidan con los filtros."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}