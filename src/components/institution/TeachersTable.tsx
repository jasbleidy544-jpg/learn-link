import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye } from "lucide-react";
import { exportToCSV } from "@/lib/adminAudit";

export type TeacherRow = {
  id: string;
  full_name: string;
  email?: string;
  subjects?: string;
  students_count: number;
  last_sign_in_at?: string | null;
  created_at?: string | null;
  institution_code?: string | null;
  active: boolean;
};

interface Props {
  teachers: TeacherRow[];
  onOpenDetail: (id: string) => void;
}

export default function TeachersTable({ teachers, onOpenDetail }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      if (query) {
        const q = query.toLowerCase();
        if (!t.full_name?.toLowerCase().includes(q) && !t.email?.toLowerCase().includes(q)) return false;
      }
      if (status === "active" && !t.active) return false;
      if (status === "inactive" && t.active) return false;
      return true;
    });
  }, [teachers, query, status]);

  const handleExport = () => {
    exportToCSV(
      filtered.map((t) => ({
        Nombre: t.full_name,
        Email: t.email ?? "",
        "Fecha de registro": t.created_at ?? "",
        "Último acceso": t.last_sign_in_at ?? "",
        "Código institucional": t.institution_code ?? "",
      })),
      "docentes.csv"
    );
  };

  return (
    <Card className="cloud-card">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Docentes voluntarios ({filtered.length})</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-48" placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2 pr-3">Nombre completo</th>
                <th className="py-2 pr-3">Correo electrónico</th>
                <th className="py-2 pr-3">Fecha de registro</th>
                <th className="py-2 pr-3">Último acceso</th>
                <th className="py-2 pr-3">Código institucional</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-card/60">
                  <td className="py-2 pr-3 font-medium">{t.full_name}</td>
                  <td className="py-2 pr-3">{t.email || "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {t.last_sign_in_at ? new Date(t.last_sign_in_at).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {t.institution_code ? (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/40">
                        ✓ {t.institution_code}
                      </Badge>
                    ) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => onOpenDetail(t.id)}>
                      <Eye className="w-4 h-4 mr-1" /> Ver perfil
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-6">
                    {teachers.length === 0
                      ? "Aún no hay docentes registrados con este código."
                      : "Sin docentes que coincidan con los filtros."}
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