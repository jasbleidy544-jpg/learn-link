import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { logAdminAction, exportToCSV } from "@/lib/adminAudit";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Pencil, Trash2, Download, Search, RefreshCw, Copy } from "lucide-react";

type Inst = { id?: string; name: string; contact_email?: string; contact_phone?: string; address?: string; status: string; notes?: string; student_code?: string; teacher_code?: string };

export default function AdminInstitutions() {
  const { toast } = useToast();
  const [list, setList] = useState<Inst[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Inst | null>(null);
  const [del, setDel] = useState<string | null>(null);

  const load = async () => {
    const { data } = await (supabase as any).from("institutions").select("*").order("created_at", { ascending: false });
    setList(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) {
      await (supabase as any).from("institutions").update(editing).eq("id", editing.id);
      await logAdminAction("update_institution", "institution", editing.id);
    } else {
      const { data } = await (supabase as any).from("institutions").insert(editing).select().single();
      await logAdminAction("create_institution", "institution", data?.id);
    }
    toast({ title: "Guardado" });
    setEditing(null);
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from("institutions").update({ status }).eq("id", id);
    await logAdminAction(`institution_${status}`, "institution", id);
    toast({ title: status === "approved" ? "Aprobada" : "Rechazada" });
    load();
  };

  const remove = async () => {
    if (!del) return;
    await (supabase as any).from("institutions").delete().eq("id", del);
    await logAdminAction("delete_institution", "institution", del);
    toast({ title: "Eliminada" });
    setDel(null);
    load();
  };

  const regenerate = async (id: string, which: "student" | "teacher") => {
    const { data, error } = await (supabase as any).rpc("regenerate_institution_code", { _institution_id: id, _which: which });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await logAdminAction(`regenerate_${which}_code`, "institution", id, { new_code: data });
    toast({ title: "Código regenerado", description: data });
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado", description: code });
  };

  const filtered = list.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instituciones</h1>
          <p className="text-muted-foreground">{filtered.length} instituciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(filtered, "instituciones.csv")}><Download className="w-4 h-4 mr-2" />Exportar</Button>
          <Button onClick={() => setEditing({ name: "", status: "pending" })}><Plus className="w-4 h-4 mr-2" />Nueva</Button>
        </div>
      </div>
      <Card className="cloud-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Contacto</TableHead><TableHead>Códigos</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.contact_email}<br />{i.contact_phone}</TableCell>
                  <TableCell className="text-xs font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400">{i.student_code || "—"}</span>
                      {i.student_code && <>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyCode(i.student_code!)}><Copy className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => regenerate(i.id!, "student")} title="Regenerar"><RefreshCw className="w-3 h-3" /></Button>
                      </>}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-purple-400">{i.teacher_code || "—"}</span>
                      {i.teacher_code && <>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyCode(i.teacher_code!)}><Copy className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => regenerate(i.id!, "teacher")} title="Regenerar"><RefreshCw className="w-3 h-3" /></Button>
                      </>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={i.status === "approved" ? "default" : i.status === "rejected" ? "destructive" : "secondary"}>{i.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {i.status === "pending" && <>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(i.id!, "approved")} title="Aprobar"><Check className="w-4 h-4 text-green-500" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(i.id!, "rejected")} title="Rechazar"><X className="w-4 h-4 text-destructive" /></Button>
                    </>}
                    <Button size="sm" variant="ghost" onClick={() => setEditing(i)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDel(i.id!)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nueva"} institución</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Email de contacto</Label><Input value={editing.contact_email || ""} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={editing.contact_phone || ""} onChange={(e) => setEditing({ ...editing, contact_phone: e.target.value })} /></div>
              <div><Label>Dirección</Label><Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="¿Eliminar institución?" description="Esta acción no se puede deshacer." destructive confirmText="Eliminar" onConfirm={remove} />
    </div>
  );
}