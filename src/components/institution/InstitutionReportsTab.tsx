import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LabelList,
} from "recharts";
import {
  Loader2, Download, FileDown, TrendingUp, TrendingDown, Minus,
  PieChart as PieIcon, LineChart as LineIcon, GraduationCap, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/lib/adminAudit";
import { toast } from "sonner";

type StudentLite = { id: string; full_name: string; grade?: string };
type TeacherLite = { id: string; full_name: string };

interface Props {
  institutionId: string | null;
  institutionName: string;
  students: StudentLite[];
  teachers: TeacherLite[];
}

const RISK_COLORS: Record<string, string> = {
  alto: "hsl(0 72% 51%)",
  medio: "hsl(38 92% 50%)",
  bajo: "hsl(142 71% 45%)",
  sin_diagnostico: "hsl(220 9% 46%)",
};
const RISK_LABEL: Record<string, string> = {
  alto: "Riesgo alto",
  medio: "Riesgo medio",
  bajo: "Riesgo bajo",
  sin_diagnostico: "Sin diagnóstico",
};
const RISK_SCORE: Record<string, number> = { alto: 85, medio: 50, bajo: 15 };

const MONTH_LABEL = (d: Date) =>
  d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }).replace(".", "");

function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InstitutionReportsTab({ institutionId, institutionName, students, teachers }: Props) {
  const [loading, setLoading] = useState(true);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [actEst, setActEst] = useState<any[]>([]);
  const [aiActs, setAiActs] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  const donutRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const studentIds = useMemo(() => students.map((s) => s.id), [students]);

  useEffect(() => {
    if (!institutionId || studentIds.length === 0) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: diags }, { data: ae }, { data: sa }, { data: asg }] = await Promise.all([
        (supabase as any)
          .from("diagnosticos")
          .select("user_id, nivel_riesgo, status, completed_at")
          .in("user_id", studentIds)
          .eq("status", "completed")
          .order("completed_at", { ascending: true }),
        (supabase as any)
          .from("actividades_estudiantes")
          .select("estudiante_id, completada, puntaje, fecha_realizacion, actividades (materia, docente_id)")
          .in("estudiante_id", studentIds)
          .eq("completada", true),
        (supabase as any)
          .from("student_activities")
          .select("student_id, area, score, status, completed_at")
          .in("student_id", studentIds)
          .eq("status", "completed"),
        institutionId
          ? (supabase as any).from("asignaciones").select("docente_id, estudiante_id").eq("institution_id", institutionId)
          : Promise.resolve({ data: [] }),
      ]);
      if (cancelled) return;
      setDiagnosticos(diags || []);
      setActEst(ae || []);
      setAiActs(sa || []);
      setAsignaciones(asg || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [institutionId, studentIds.join(",")]);

  // --- 1) Distribución de riesgo (último diagnóstico por estudiante) ---
  const riskDistribution = useMemo(() => {
    const latestByStudent = new Map<string, any>();
    diagnosticos.forEach((d) => {
      const prev = latestByStudent.get(d.user_id);
      if (!prev || new Date(d.completed_at) > new Date(prev.completed_at)) latestByStudent.set(d.user_id, d);
    });
    const counts: Record<string, number> = { alto: 0, medio: 0, bajo: 0, sin_diagnostico: 0 };
    students.forEach((s) => {
      const r = latestByStudent.get(s.id)?.nivel_riesgo ?? "sin_diagnostico";
      counts[r] = (counts[r] ?? 0) + 1;
    });
    return counts;
  }, [diagnosticos, students]);

  const donutData = useMemo(
    () => Object.entries(riskDistribution)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: RISK_LABEL[k], key: k, value: v })),
    [riskDistribution]
  );

  // --- 2) Evolución temporal del riesgo (promedio mensual) ---
  const trendData = useMemo(() => {
    const byMonth = new Map<string, { sum: number; n: number; date: Date }>();
    diagnosticos.forEach((d) => {
      if (!d.completed_at || !d.nivel_riesgo) return;
      const key = monthKey(d.completed_at);
      const entry = byMonth.get(key) || { sum: 0, n: 0, date: new Date(d.completed_at) };
      entry.sum += RISK_SCORE[d.nivel_riesgo] ?? 50;
      entry.n += 1;
      byMonth.set(key, entry);
    });
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => ({ mes: MONTH_LABEL(v.date), riesgo: Math.round(v.sum / v.n) }));
  }, [diagnosticos]);

  // --- Puntajes combinados por estudiante (docente-enviadas + retos IA) ---
  const scoresByStudent = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    actEst.forEach((r) => {
      if (typeof r.puntaje !== "number") return;
      const e = map.get(r.estudiante_id) || { sum: 0, n: 0 };
      e.sum += r.puntaje; e.n += 1;
      map.set(r.estudiante_id, e);
    });
    aiActs.forEach((r) => {
      if (typeof r.score !== "number") return;
      const e = map.get(r.student_id) || { sum: 0, n: 0 };
      e.sum += r.score; e.n += 1;
      map.set(r.student_id, e);
    });
    return map;
  }, [actEst, aiActs]);

  // --- 3) Ranking de docentes ---
  const teacherRanking = useMemo(() => {
    const byTeacher = new Map<string, Set<string>>();
    asignaciones.forEach((a) => {
      const set = byTeacher.get(a.docente_id) || new Set<string>();
      set.add(a.estudiante_id);
      byTeacher.set(a.docente_id, set);
    });

    return teachers.map((t) => {
      const studentSet = byTeacher.get(t.id) || new Set<string>();
      // Puntajes (con fecha) de los estudiantes asignados a este docente
      const points: { score: number; date: string }[] = [];
      actEst.forEach((r) => {
        if (studentSet.has(r.estudiante_id) && typeof r.puntaje === "number" && r.fecha_realizacion) {
          points.push({ score: r.puntaje, date: r.fecha_realizacion });
        }
      });
      aiActs.forEach((r) => {
        if (studentSet.has(r.student_id) && typeof r.score === "number" && r.completed_at) {
          points.push({ score: r.score, date: r.completed_at });
        }
      });
      points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const avg = points.length ? Math.round(points.reduce((a, p) => a + p.score, 0) / points.length) : null;

      let variacion: number | null = null;
      if (points.length >= 4) {
        const mid = Math.floor(points.length / 2);
        const first = points.slice(0, mid);
        const second = points.slice(mid);
        const avgFirst = first.reduce((a, p) => a + p.score, 0) / first.length;
        const avgSecond = second.reduce((a, p) => a + p.score, 0) / second.length;
        variacion = Math.round(avgSecond - avgFirst);
      }

      return {
        id: t.id,
        nombre: t.full_name,
        estudiantes: studentSet.size,
        promedio: avg,
        variacion,
        muestras: points.length,
      };
    }).sort((a, b) => (b.promedio ?? -1) - (a.promedio ?? -1));
  }, [teachers, asignaciones, actEst, aiActs]);

  // --- 4) Materias críticas ---
  const subjectStats = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    actEst.forEach((r) => {
      const materia = r.actividades?.materia;
      if (!materia || typeof r.puntaje !== "number") return;
      const e = map.get(materia) || { sum: 0, n: 0 };
      e.sum += r.puntaje; e.n += 1;
      map.set(materia, e);
    });
    aiActs.forEach((r) => {
      const area = r.area ? r.area.charAt(0).toUpperCase() + r.area.slice(1) : null;
      if (!area || typeof r.score !== "number") return;
      const e = map.get(area) || { sum: 0, n: 0 };
      e.sum += r.score; e.n += 1;
      map.set(area, e);
    });
    return Array.from(map.entries())
      .map(([materia, v]) => ({ materia, promedio: Math.round(v.sum / v.n), muestras: v.n }))
      .sort((a, b) => a.promedio - b.promedio);
  }, [actEst, aiActs]);

  const criticalSubjects = subjectStats.slice(0, 6);

  // --- Export CSV ---
  const exportCSV = () => {
    const latestByStudent = new Map<string, any>();
    diagnosticos.forEach((d) => {
      const prev = latestByStudent.get(d.user_id);
      if (!prev || new Date(d.completed_at) > new Date(prev.completed_at)) latestByStudent.set(d.user_id, d);
    });
    const rows = students.map((s) => {
      const risk = latestByStudent.get(s.id)?.nivel_riesgo ?? "sin_diagnostico";
      const sc = scoresByStudent.get(s.id);
      return {
        Nombre: s.full_name,
        Grado: s.grade || "",
        "Nivel de riesgo": RISK_LABEL[risk],
        "Puntaje promedio": sc ? Math.round(sc.sum / sc.n) : "",
      };
    });
    if (!rows.length) { toast.error("No hay estudiantes para exportar."); return; }
    exportToCSV(rows, `reporte-institucional-${institutionName.replace(/\s+/g, "_").toLowerCase()}.csv`);
    toast.success("CSV descargado.");
  };

  // --- Export PDF ---
  const exportPDF = async () => {
    setExportingPdf(true);
    try {
      const [{ default: jsPDF }, autoTableMod, html2canvas] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        import("html2canvas").then((m) => m.default),
      ]);
      const autoTable = (autoTableMod as any).default;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 48;

      doc.setFontSize(18);
      doc.setTextColor(88, 28, 135);
      doc.text(institutionName, 40, y);
      y += 22;
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text("Reporte de Analítica Institucional — LearnLink", 40, y);
      y += 16;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generado el ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}`, 40, y);
      y += 24;

      // Stat boxes
      const total = students.length;
      const stats = [
        { label: "Estudiantes", value: String(total) },
        { label: "Docentes", value: String(teachers.length) },
        { label: "Riesgo alto", value: String(riskDistribution.alto || 0) },
        { label: "Riesgo medio", value: String(riskDistribution.medio || 0) },
        { label: "Riesgo bajo", value: String(riskDistribution.bajo || 0) },
      ];
      const boxW = (pageWidth - 80 - (stats.length - 1) * 8) / stats.length;
      stats.forEach((s, i) => {
        const x = 40 + i * (boxW + 8);
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(x, y, boxW, 52, 6, 6, "F");
        doc.setFontSize(14);
        doc.setTextColor(88, 28, 135);
        doc.text(s.value, x + boxW / 2, y + 24, { align: "center" });
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(s.label, x + boxW / 2, y + 40, { align: "center" });
      });
      y += 72;

      // Chart images (si están disponibles en pantalla)
      const addChart = async (ref: React.RefObject<HTMLDivElement>, title: string, w: number, x: number) => {
        if (!ref.current) return 0;
        try {
          const canvas = await html2canvas(ref.current, { backgroundColor: "#0b0b1a", scale: 2 });
          const imgData = canvas.toDataURL("image/png");
          const h = (canvas.height / canvas.width) * w;
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          doc.text(title, x, y);
          doc.addImage(imgData, "PNG", x, y + 6, w, h);
          return h + 16;
        } catch { return 0; }
      };

      const chartW = (pageWidth - 80 - 16) / 2;
      const [h1, h2] = await Promise.all([
        addChart(donutRef, "Distribución de riesgo", chartW, 40),
        addChart(lineRef, "Evolución temporal del riesgo", chartW, 40 + chartW + 16),
      ]);
      y += Math.max(h1, h2) + 10;

      if (y > doc.internal.pageSize.getHeight() - 150) { doc.addPage(); y = 48; }

      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text("Ranking de docentes", 40, y);
      autoTable(doc, {
        startY: y + 8,
        head: [["Docente", "Estudiantes", "Promedio", "Variación"]],
        body: teacherRanking.map((t) => [
          t.nombre,
          String(t.estudiantes),
          t.promedio != null ? `${t.promedio}/100` : "Sin datos",
          t.variacion == null ? "—" : t.variacion > 0 ? `↑ +${t.variacion}` : t.variacion < 0 ? `↓ ${t.variacion}` : "Estable",
        ]),
        theme: "striped",
        headStyles: { fillColor: [124, 58, 237] },
        margin: { left: 40, right: 40 },
      });
      y = (doc as any).lastAutoTable.finalY + 24;

      if (y > doc.internal.pageSize.getHeight() - 150) { doc.addPage(); y = 48; }

      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text("Materias críticas (promedio más bajo)", 40, y);
      autoTable(doc, {
        startY: y + 8,
        head: [["Materia", "Promedio", "Actividades evaluadas"]],
        body: criticalSubjects.map((s) => [s.materia, `${s.promedio}/100`, String(s.muestras)]),
        theme: "striped",
        headStyles: { fillColor: [124, 58, 237] },
        margin: { left: 40, right: 40 },
      });

      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("Generado automáticamente por LearnLink — \"La tecnología orienta, las personas acompañan\".", 40, doc.internal.pageSize.getHeight() - 24);

      doc.save(`reporte-institucional-${institutionName.replace(/\s+/g, "_").toLowerCase()}.pdf`);
      toast.success("PDF generado correctamente.");
    } catch (e: any) {
      toast.error("No se pudo generar el PDF: " + (e?.message || "error desconocido"));
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando analítica institucional...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con exportaciones */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gradient">Centro de comando institucional</h2>
          <p className="text-sm text-muted-foreground">Panorama general del riesgo, el impacto docente y las materias que necesitan refuerzo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Exportar a CSV
          </Button>
          <Button onClick={exportPDF} disabled={exportingPdf} className="gap-2">
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Descargar Reporte PDF
          </Button>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="cloud-card glow-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="w-5 h-5 text-primary" /> Distribución de riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Aún no hay diagnósticos completados en tu institución.
              </p>
            ) : (
              <div ref={donutRef} className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {donutData.map((d) => (
                        <Cell key={d.key} fill={RISK_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} estudiante${value === 1 ? "" : "s"}`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, background: "#1a1a2e", border: "1px solid #4c1d95" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="cloud-card glow-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineIcon className="w-5 h-5 text-accent" /> Evolución temporal del riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length < 2 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Aún no hay suficiente histórico de diagnósticos para graficar una tendencia.
              </p>
            ) : (
              <div ref={lineRef} className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(220 10% 70%)" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(220 10% 70%)" }} />
                    <Tooltip
                      formatter={(v: number) => [`${v}/100`, "Riesgo promedio"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, background: "#1a1a2e", border: "1px solid #4c1d95" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="riesgo"
                      stroke="hsl(262 83% 63%)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "hsl(262 83% 63%)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking de docentes */}
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="w-5 h-5 text-primary" /> Ranking de desempeño docente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teacherRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aún no hay docentes vinculados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 pr-3">Docente</th>
                    <th className="py-2 pr-3">Estudiantes asignados</th>
                    <th className="py-2 pr-3">Promedio de puntaje</th>
                    <th className="py-2 pr-3">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherRanking.map((t) => (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-card/60">
                      <td className="py-2 pr-3 font-medium">{t.nombre}</td>
                      <td className="py-2 pr-3">{t.estudiantes}</td>
                      <td className="py-2 pr-3">
                        {t.promedio != null ? (
                          <span className="font-semibold text-gradient">{t.promedio}/100</span>
                        ) : (
                          <span className="text-muted-foreground">Sin datos</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {t.variacion == null ? (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <Minus className="w-3 h-3 mr-1" /> Sin datos suficientes
                          </Badge>
                        ) : t.variacion > 0 ? (
                          <Badge variant="outline" className="bg-green-500/15 text-green-300 border-green-500/40">
                            <TrendingUp className="w-3 h-3 mr-1" /> Mejorando (+{t.variacion})
                          </Badge>
                        ) : t.variacion < 0 ? (
                          <Badge variant="outline" className="bg-red-500/15 text-red-300 border-red-500/40">
                            <TrendingDown className="w-3 h-3 mr-1" /> Necesita apoyo ({t.variacion})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <Minus className="w-3 h-3 mr-1" /> Estable
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materias críticas */}
      <Card className="cloud-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Materias críticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay suficientes actividades completadas para identificar materias críticas.
            </p>
          ) : (
            <>
              <div className="h-56 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={criticalSubjects} layout="vertical" margin={{ left: 24, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 25%)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(220 10% 70%)" }} />
                    <YAxis type="category" dataKey="materia" width={100} tick={{ fontSize: 12, fill: "hsl(220 10% 80%)" }} />
                    <Tooltip
                      formatter={(v: number) => [`${v}/100`, "Promedio"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, background: "#1a1a2e", border: "1px solid #4c1d95" }}
                    />
                    <Bar dataKey="promedio" radius={[0, 6, 6, 0]}>
                      {criticalSubjects.map((s, i) => (
                        <Cell key={i} fill={s.promedio < 60 ? RISK_COLORS.alto : s.promedio < 75 ? RISK_COLORS.medio : RISK_COLORS.bajo} />
                      ))}
                      <LabelList dataKey="promedio" position="right" formatter={(v: number) => `${v}`} style={{ fontSize: 11, fill: "hsl(220 10% 90%)" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio combinado de actividades enviadas por docentes y retos de IA, por materia, en toda la institución.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
