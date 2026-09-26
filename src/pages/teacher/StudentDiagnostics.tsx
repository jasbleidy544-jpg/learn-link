import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Search, Eye, AlertTriangle, CheckCircle, TrendingUp, FileText } from "lucide-react";

type StudentDiag = {
  student_id: string;
  full_name: string;
  grade: string | null;
  email: string;
  diagnostico_id: string | null;
  nivel_riesgo: "alto" | "medio" | "bajo" | null;
  ultima_fecha: string | null;
  resultado: any;
};

export default function StudentDiagnostics() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentDiag[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<StudentDiag | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // 1. Estudiantes asignados al docente
    const { data: assigns, error: assignErr } = await (supabase as any)
      .from("asignaciones")
      .select("estudiante_id")
      .eq("docente_id", user.id);

    if (assignErr) {
      console.error("[StudentDiagnostics] error asignaciones:", assignErr);
      setLoading(false);
      return;
    }

    const ids = (assigns || []).map((a: any) => a.estudiante_id);
    if (ids.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    // 2. Perfiles de esos estudiantes
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, email, grade")
      .in("id", ids);

    // 3. Diagnósticos (último por estudiante)
    const { data: diags } = await (supabase as any)
      .from("diagnosticos")
      .select("id, user_id, nivel_riesgo, resultado, completed_at")
      .in("user_id", ids)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    const latestByUser = new Map<string, any>();
    (diags || []).forEach((d: any) => {
      if (!latestByUser.has(d.user_id)) latestByUser.set(d.user_id, d);
    });

    const rows: StudentDiag[] = (profiles || []).map((p: any) => {
      const d = latestByUser.get(p.id);
      return {
        student_id: p.id,
        full_name: p.full_name || "Sin nombre",
        email: p.email || "",
        grade: p.grade || null,
        diagnostico_id: d?.id || null,
        nivel_riesgo: d?.nivel_riesgo || null,
        ultima_fecha: d?.completed_at || null,
        resultado: d?.resultado || null,
      };
    });

    setStudents(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(q.toLowerCase()) ||
      s.email.toLowerCase().includes(q.toLowerCase())
  );

  const riskBadge = (nivel: StudentDiag["nivel_riesgo"]) => {
    if (!nivel) return <Badge variant="outline">Sin diagnóstico</Badge>;
    if (nivel === "alto")
      return <Badge variant="destructive">🔴 Riesgo alto</Badge>;
    if (nivel === "medio")
      return <Badge className="bg-yellow-500 text-black">🟡 Riesgo medio</Badge>;
    return <Badge className="bg-green-600 text-white">🟢 Riesgo bajo</Badge>;
  };

  const withDiag = students.filter((s) => s.diagnostico_id).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🧠 Diagnósticos de mis estudiantes</h1>
        <p className="text-muted-foreground">
          {withDiag} de {students.length} estudiantes han completado su diagnóstico inicial.
        </p>
      </div>

      <Card className="cloud-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar estudiante…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Grado</TableHead>
                <TableHead>Nivel de riesgo</TableHead>
                <TableHead>Último diagnóstico</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No tienes estudiantes asignados todavía.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.student_id}>
                    <TableCell>
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </TableCell>
                    <TableCell>{s.grade || "—"}</TableCell>
                    <TableCell>{riskBadge(s.nivel_riesgo)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.ultima_fecha
                        ? new Date(s.ultima_fecha).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!s.diagnostico_id}
                        onClick={() => setDetail(s)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal con el detalle del diagnóstico */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && detail.resultado && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {detail.full_name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 pt-1">
                  {riskBadge(detail.nivel_riesgo)}
                  <span className="text-xs text-muted-foreground">
                    Diagnóstico del{" "}
                    {detail.ultima_fecha
                      ? new Date(detail.ultima_fecha).toLocaleDateString("es-CO")
                      : "—"}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Resumen para el docente */}
                {detail.resultado.resumen_para_docente && (
                  <Card className="cloud-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Resumen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {detail.resultado.resumen_para_docente}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Fortalezas y riesgos */}
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.isArray(detail.resultado.areas_fortaleza) &&
                    detail.resultado.areas_fortaleza.length > 0 && (
                      <Card className="cloud-card border-green-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2 text-green-500">
                            <CheckCircle className="w-4 h-4" />
                            Fortalezas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1.5">
                            {detail.resultado.areas_fortaleza.map(
                              (a: string, i: number) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span>{a}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                  {Array.isArray(detail.resultado.areas_riesgo) &&
                    detail.resultado.areas_riesgo.length > 0 && (
                      <Card className="cloud-card border-red-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2 text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            Áreas de atención
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1.5">
                            {detail.resultado.areas_riesgo.map(
                              (a: string, i: number) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span>{a}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                </div>

                {/* Recomendaciones */}
                {Array.isArray(detail.resultado.recomendaciones) &&
                  detail.resultado.recomendaciones.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Recomendaciones de la IA
                      </h3>
                      <div className="space-y-3">
                        {detail.resultado.recomendaciones.map(
                          (r: any, i: number) => (
                            <Card key={i} className="cloud-card">
                              <CardContent className="p-4">
                                <h4 className="font-medium mb-1">
                                  {i + 1}. {r.titulo}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {r.descripcion}
                                </p>
                                {Array.isArray(r.acciones) && r.acciones.length > 0 && (
                                  <ul className="space-y-1 mt-2">
                                    {r.acciones.map((acc: string, j: number) => (
                                      <li
                                        key={j}
                                        className="text-xs text-muted-foreground flex items-start gap-2"
                                      >
                                        <span className="text-primary">→</span>
                                        <span>{acc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Etiquetas */}
                {Array.isArray(detail.resultado.etiquetas) &&
                  detail.resultado.etiquetas.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Etiquetas del estudiante:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detail.resultado.etiquetas.map((t: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}