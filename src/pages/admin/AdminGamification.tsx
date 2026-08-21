import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { logAdminAction } from "@/lib/adminAudit";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";

export default function AdminGamification() {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [editBadge, setEditBadge] = useState<any | null>(null);
  const [reset, setReset] = useState<string | null>(null);

  const load = async () => {
    const [g, b] = await Promise.all([
      (supabase as any).from("student_gamification").select("*, profiles!inner(full_name, email)").limit(200),
      (supabase as any).from("badges").select("*").order("created_at", { ascending: false }),
    ]);
    setStudents(g.data || []);
    setBadges(b.data || []);
  };
  useEffect(() => { load(); }, []);

  const saveStudent = async () => {
    if (!editStudent) return;
    await (supabase as any).from("student_gamification").update({ level: editStudent.level, xp: editStudent.xp }).eq("id", editStudent.id);
    await logAdminAction("update_gamification", "student", editStudent.student_id, { level: editStudent.level, xp: editStudent.xp });
    toast({ title: "Progreso actualizado" });
    setEditStudent(null); load();
  };

  const doReset = async () => {
    if (!reset) return;
    await (supabase as any).from("student_gamification").update({ level: 1, xp: 0, badges_earned: [] }).eq("id", reset);
    await logAdminAction("reset_progress", "student", reset);
    toast({ title: "Progreso reiniciado" });
    setReset(null); load();
  };

  const saveBadge = async () => {
    if (!editBadge) return;
    if (editBadge.id) await (supabase as any).from("badges").update(editBadge).eq("id", editBadge.id);
    else await (supabase as any).from("badges").insert(editBadge);
    await logAdminAction(editBadge.id ? "update_badge" : "create_badge", "badge", editBadge.id || editBadge.name);
    toast({ title: "Insignia guardada" });
    setEditBadge(null); load();
  };

  const deleteBadge = async (id: string) => {
    await (supabase as any).from("badges").delete().eq("id", id);
    await logAdminAction("delete_badge", "badge", id);
    toast({ title: "Insignia eliminada" });
    load();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold">Gamificación</h1><p className="text-muted-foreground">Niveles, XP e insignias</p></div>
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Progreso de estudiantes</TabsTrigger>
          <TabsTrigger value="badges">Insignias</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <Card className="cloud-card">
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>Estudiante</TableHead><TableHead>Nivel</TableHead><TableHead>XP</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.profiles?.full_name || s.student_id.slice(0,8)}</TableCell>
                      <TableCell>{s.level}</TableCell>
                      <TableCell>{s.xp}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditStudent(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setReset(s.id)}><RotateCcw className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="badges">
          <Card className="cloud-card">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Catálogo</CardTitle>
              <Button onClick={() => setEditBadge({ name: "", description: "", icon: "🏅", xp_reward: 0, is_active: true })}><Plus className="w-4 h-4 mr-2" />Nueva</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Icono</TableHead><TableHead>Nombre</TableHead><TableHead>XP</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {badges.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-2xl">{b.icon}</TableCell>
                      <TableCell><div className="font-medium">{b.name}</div><div className="text-xs text-muted-foreground">{b.description}</div></TableCell>
                      <TableCell>{b.xp_reward}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditBadge(b)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteBadge(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editStudent} onOpenChange={(o) => !o && setEditStudent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar progreso</DialogTitle></DialogHeader>
          {editStudent && (
            <div className="space-y-3">
              <div><Label>Nivel</Label><Input type="number" value={editStudent.level} onChange={(e) => setEditStudent({ ...editStudent, level: +e.target.value })} /></div>
              <div><Label>XP</Label><Input type="number" value={editStudent.xp} onChange={(e) => setEditStudent({ ...editStudent, xp: +e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditStudent(null)}>Cancelar</Button><Button onClick={saveStudent}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBadge} onOpenChange={(o) => !o && setEditBadge(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editBadge?.id ? "Editar" : "Nueva"} insignia</DialogTitle></DialogHeader>
          {editBadge && (
            <div className="space-y-3">
              <div><Label>Icono (emoji)</Label><Input value={editBadge.icon || ""} onChange={(e) => setEditBadge({ ...editBadge, icon: e.target.value })} /></div>
              <div><Label>Nombre</Label><Input value={editBadge.name} onChange={(e) => setEditBadge({ ...editBadge, name: e.target.value })} /></div>
              <div><Label>Descripción</Label><Input value={editBadge.description || ""} onChange={(e) => setEditBadge({ ...editBadge, description: e.target.value })} /></div>
              <div><Label>XP de recompensa</Label><Input type="number" value={editBadge.xp_reward} onChange={(e) => setEditBadge({ ...editBadge, xp_reward: +e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditBadge(null)}>Cancelar</Button><Button onClick={saveBadge}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!reset} onOpenChange={(o) => !o && setReset(null)} title="¿Reiniciar progreso?" description="El estudiante volverá al nivel 1 con 0 XP." destructive confirmText="Reiniciar" onConfirm={doReset} />
    </div>
  );
}