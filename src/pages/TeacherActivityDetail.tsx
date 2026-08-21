import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Resultado = {
  id: string;
  completada: boolean;
  puntaje: number | null;
  fecha_realizacion: string | null;
  enviada_en: string;
  estudiante_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
};

type Actividad = {
  id: string;
  titulo: string;
  materia: string;
  tema: string | null;
  dificultad: string;
  creado_en: string;
  docente_nombre: string | null;
};

const RANGES = [
  { label: "0-20", min: 0, max: 20 },
  { label: "21-40", min: 21, max: 40 },
  { label: "41-60", min: 41, max: 60 },
  { label: "61-80", min: 61, max: 80 },
  { label: "81-100", min: 81, max: 100 },
];

export default function TeacherActivityDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [results, setResults] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: act }, { data: res }] = await Promise.all([
        (supabase as any).from("actividades").select("id, titulo, materia, tema, dificultad, creado_en, docente_nombre").eq("id", id).maybeSingle(),
        (supabase as any).from("actividades_estudiantes")
          .select("id, completada, puntaje, fecha_realizacion, enviada_en, estudiante_id, profiles:profiles!actividades_estudiantes_estudiante_id_fkey(full_name, email)")
          .eq("actividad_id", id),
      ]);
      setActividad(act as Actividad);
      setResults((res as Resultado[]) || []);
      setLoading(false);
    })();
  }, [id]);

  const completaron = useMemo(() =>
    [...results.filter(r => r.completada)].sort((a, b) => (b.puntaje || 0) - (a.puntaje || 0)),
  [results]);
  const pendientes = useMemo(() => results.filter(r => !r.completada), [results]);

  const chartData = useMemo(() => RANGES.map(r => ({
    rango: r.label,
    estudiantes: completaron.filter(c => (c.puntaje ?? 0) >= r.min && (c.puntaje ?? 0) <= r.max).length,
  })), [completaron]);

  const stats = useMemo(() => {
    if (!completaron.length) return null;
    const puntajes = completaron.map(c => c.puntaje || 0);
    return {
      avg: Math.round(puntajes.reduce((a, b) => a + b, 0) / puntajes.length),
      max: Math.max(...puntajes),
      min: Math.min(...puntajes),
      total: completaron.length,
    };
  }, [completaron]);

  const top3 = completaron.slice(0, 3);
  const medals = ["🥇 1er lugar", "🥈 2do lugar", "🥉 3er lugar"];

  const handleRemind = async (studentId: string) => {
    if (!user || !actividad) return;
    setSendingTo(studentId);
    const teacherName = profile?.full_name || "Tu docente";
    const { error } = await (supabase as any).from("student_notifications").insert({
      student_id: studentId,
      sender_id: user.id,
      title: "Recordatorio de actividad",
      message: `Tu docente ${teacherName} te recuerda completar la actividad: ${actividad.titulo}`,
    });
    setSendingTo(null);
    if (error) toast.error("No se pudo enviar el recordatorio");
    else toast.success("Recordatorio enviado");
  };

  if (loading) {
    return (
      <div className="min-h-screen night-sky">
        <Navbar />
        <div className="pt-32 flex justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />Cargando...
        </div>
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="min-h-screen night-sky">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground">Actividad no encontrada.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen night-sky">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/teacher-dashboard/historial"><ArrowLeft className="w-4 h-4 mr-2" />Volver al historial</Link>
          </Button>

          <Card className="cloud-card">
            <CardHeader>
              <CardTitle className="text-xl">{actividad.titulo}</CardTitle>
              <div className="flex gap-2 flex-wrap text-sm text-muted-foreground">
                <Badge variant="outline">{actividad.materia}</Badge>
                {actividad.tema && <Badge variant="outline">{actividad.tema}</Badge>}
                <Badge variant="outline">{actividad.dificultad}</Badge>
              </div>
            </CardHeader>
          </Card>

          <Card className="cloud-card">
            <CardHeader><CardTitle className="text-lg">📊 Distribución de resultados</CardTitle></CardHeader>
            <CardContent>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rango" stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="estudiantes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {top3.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold">🏆 Mejores puntajes</h4>
                  {top3.map((s, i) => (
                    <div key={s.id} className="flex justify-between p-2 rounded bg-muted/30">
                      <span>{medals[i]}: {s.profiles?.full_name || "Estudiante"}</span>
                      <span className="font-semibold">{s.puntaje} pts</span>
                    </div>
                  ))}
                </div>
              )}

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  <Stat label="Promedio" value={`${stats.avg} pts`} />
                  <Stat label="Más alto" value={`${stats.max} pts`} />
                  <Stat label="Más bajo" value={`${stats.min} pts`} />
                  <Stat label="Completaron" value={stats.total.toString()} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="cloud-card">
            <CardHeader><CardTitle className="text-lg">👥 Estudiantes</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="hicieron">
                <TabsList className="grid grid-cols-2 w-full md:w-auto">
                  <TabsTrigger value="hicieron">✅ Realizada ({completaron.length})</TabsTrigger>
                  <TabsTrigger value="pendientes">❌ Pendiente ({pendientes.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="hicieron" className="mt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Correo</TableHead>
                          <TableHead>Puntaje</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completaron.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Aún nadie la completó.</TableCell></TableRow>
                        ) : completaron.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>{s.profiles?.full_name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{s.profiles?.email || "—"}</TableCell>
                            <TableCell className="font-semibold">{s.puntaje} pts</TableCell>
                            <TableCell className="text-muted-foreground">
                              {s.fecha_realizacion ? new Date(s.fecha_realizacion).toLocaleString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="pendientes" className="mt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Correo</TableHead>
                          <TableHead>Fecha de envío</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendientes.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Todos los estudiantes completaron la actividad.</TableCell></TableRow>
                        ) : pendientes.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>{s.profiles?.full_name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{s.profiles?.email || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{new Date(s.enviada_en).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" disabled={sendingTo === s.estudiante_id}
                                onClick={() => handleRemind(s.estudiante_id)}>
                                <Bell className="w-3.5 h-3.5 mr-1" />Recordar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold text-gradient">{value}</div>
    </div>
  );
}