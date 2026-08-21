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
import { Calendar, X, Pencil, ExternalLink, Download } from "lucide-react";

export default function AdminMeetings() {
  const { toast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await (supabase as any).from("meetings").select("*").order("scheduled_at", { ascending: false });
    setList(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    await (supabase as any).from("meetings").update({
      title: editing.title, scheduled_at: editing.scheduled_at, meet_link: editing.meet_link, status: editing.status,
    }).eq("id", editing.id);
    await logAdminAction("update_meeting", "meeting", editing.id);
    toast({ title: "Reunión actualizada" });
    setEditing(null); load();
  };

  const doCancel = async () => {
    if (!cancel) return;
    await (supabase as any).from("meetings").update({ status: "cancelled" }).eq("id", cancel);
    await logAdminAction("cancel_meeting", "meeting", cancel);
    toast({ title: "Reunión cancelada" });
    setCancel(null); load();
  };

  const filtered = list.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Reuniones</h1><p className="text-muted-foreground">{filtered.length} reuniones</p></div>
        <Button variant="outline" onClick={() => exportToCSV(filtered, "reuniones.csv")}><Download className="w-4 h-4 mr-2" />Exportar</Button>
      </div>
      <Card className="cloud-card">
        <CardHeader><Input placeholder="Buscar por título..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" /></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead>Enlace</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell><Calendar className="inline w-3 h-3 mr-1" />{new Date(m.scheduled_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={m.status === "scheduled" ? "default" : m.status === "cancelled" ? "destructive" : "secondary"}>{m.status}</Badge></TableCell>
                  <TableCell>{m.meet_link ? <a href={m.meet_link} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />Meet</a> : "—"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...m, scheduled_at: m.scheduled_at.slice(0,16) })}><Pencil className="w-4 h-4" /></Button>
                    {m.status !== "cancelled" && <Button size="sm" variant="ghost" onClick={() => setCancel(m.id)}><X className="w-4 h-4 text-destructive" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar reunión</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Fecha y hora</Label><Input type="datetime-local" value={editing.scheduled_at} onChange={(e) => setEditing({ ...editing, scheduled_at: e.target.value })} /></div>
              <div><Label>Enlace de Meet</Label><Input value={editing.meet_link || ""} onChange={(e) => setEditing({ ...editing, meet_link: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!cancel} onOpenChange={(o) => !o && setCancel(null)} title="¿Cancelar reunión?" destructive confirmText="Cancelar reunión" onConfirm={doCancel} />
    </div>
  );
}