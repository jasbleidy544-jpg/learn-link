import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { logAdminAction } from "@/lib/adminAudit";
import { useToast } from "@/hooks/use-toast";

export default function AdminAcademic() {
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [del, setDel] = useState<{ table: string; id: string } | null>(null);

  const load = async () => {
    const [r1, r2] = await Promise.all([
      (supabase as any).from("academic_records").select("*").order("recorded_at", { ascending: false }).limit(100),
      (supabase as any).from("ai_recommendations").select("*").order("generated_at", { ascending: false }).limit(100),
    ]);
    setRecords(r1.data || []);
    setRecs(r2.data || []);
  };
  useEffect(() => { load(); }, []);

  const remove = async () => {
    if (!del) return;
    await (supabase as any).from(del.table).delete().eq("id", del.id);
    await logAdminAction(`delete_${del.table}`, del.table, del.id);
    toast({ title: "Eliminado" });
    setDel(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión Académica</h1>
        <p className="text-muted-foreground">Registros académicos y recomendaciones de IA</p>
      </div>
      <Tabs defaultValue="grades">
        <TabsList>
          <TabsTrigger value="grades">Calificaciones</TabsTrigger>
          <TabsTrigger value="recs">Recomendaciones IA</TabsTrigger>
        </TabsList>
        <TabsContent value="grades">
          <Card className="cloud-card">
            <CardHeader><CardTitle className="text-lg">Últimos 100 registros</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Estudiante</TableHead><TableHead>Materia</TableHead><TableHead>Nota</TableHead><TableHead>Periodo</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.student_id.slice(0,8)}</TableCell>
                      <TableCell>{r.subject}</TableCell>
                      <TableCell>{r.grade_value}</TableCell>
                      <TableCell>{r.period}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => setDel({ table: "academic_records", id: r.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recs">
          <Card className="cloud-card">
            <CardHeader><CardTitle className="text-lg">Recomendaciones generadas por IA</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Estudiante</TableHead><TableHead>Tipo</TableHead><TableHead>Título</TableHead><TableHead>Prioridad</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {recs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.student_id.slice(0,8)}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell className="max-w-md truncate">{r.title}</TableCell>
                      <TableCell>{r.priority}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => setDel({ table: "ai_recommendations", id: r.id })}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="¿Eliminar registro?" destructive confirmText="Eliminar" onConfirm={remove} />
    </div>
  );
}