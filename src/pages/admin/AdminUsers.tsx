import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { logAdminAction, exportToCSV } from "@/lib/adminAudit";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, Pencil, Ban, KeyRound, ShieldCheck, RefreshCw } from "lucide-react";

type Row = { id: string; full_name: string; email: string; institution: string | null; role: string | null; status: string };

export default function AdminUsers() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState({ q: "", role: "all", status: "all" });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; onConfirm: () => void; destructive?: boolean }>({ open: false, title: "", onConfirm: () => {} });

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, statusRes] = await Promise.all([
      (supabase as any).from("profiles").select("id, full_name, email, institution"),
      (supabase as any).from("user_roles").select("user_id, role"),
      (supabase as any).from("account_status").select("user_id, status"),
    ]);
    const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]));
    const statusMap = new Map((statusRes.data || []).map((s: any) => [s.user_id, s.status]));
    setRows((profilesRes.data || []).map((p: any) => ({
      ...p,
      role: roleMap.get(p.id) || null,
      status: statusMap.get(p.id) || "active",
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (filter.q && !`${r.full_name} ${r.email}`.toLowerCase().includes(filter.q.toLowerCase())) return false;
    if (filter.role !== "all" && r.role !== filter.role) return false;
    if (filter.status !== "all" && r.status !== filter.status) return false;
    return true;
  });

  const updateProfile = async () => {
    if (!editing) return;
    await (supabase as any).from("profiles").update({ full_name: editing.full_name, institution: editing.institution }).eq("id", editing.id);
    if (editing.role) {
      await (supabase as any).from("user_roles").delete().eq("user_id", editing.id);
      await (supabase as any).from("user_roles").insert({ user_id: editing.id, role: editing.role });
    }
    await logAdminAction("update_user", "user", editing.id, { name: editing.full_name, role: editing.role });
    toast({ title: "Usuario actualizado" });
    setEditing(null);
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from("account_status").upsert({ user_id: id, status, updated_at: new Date().toISOString() });
    await logAdminAction(`status_${status}`, "user", id);
    toast({ title: `Cuenta ${status === "active" ? "reactivada" : status === "suspended" ? "suspendida" : "bloqueada"}` });
    load();
  };

  const resetPwd = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { await logAdminAction("reset_password", "user", email); toast({ title: "Correo de restablecimiento enviado" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">{filtered.length} de {rows.length} usuarios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refrescar</Button>
          <Button variant="outline" onClick={() => exportToCSV(filtered, "usuarios.csv")}><Download className="w-4 h-4 mr-2" />Exportar</Button>
        </div>
      </div>
      <Card className="cloud-card">
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Buscar nombre o correo..." value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
            </div>
            <Select value={filter.role} onValueChange={(v) => setFilter({ ...filter, role: v })}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="student">Estudiante</SelectItem>
                <SelectItem value="teacher">Docente</SelectItem>
                <SelectItem value="institution">Institución</SelectItem>
                <SelectItem value="super_admin">Admin General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v })}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email}</TableCell>
                    <TableCell><Badge variant="outline">{r.role || "—"}</Badge></TableCell>
                    <TableCell>{r.institution || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "active" ? "default" : "destructive"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(r)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => resetPwd(r.email)} title="Restablecer contraseña"><KeyRound className="w-4 h-4" /></Button>
                      {r.status === "active" ? (
                        <Button size="sm" variant="ghost" onClick={() => setConfirm({ open: true, title: "¿Suspender cuenta?", destructive: true, onConfirm: () => setStatus(r.id, "suspended") })} title="Suspender"><Ban className="w-4 h-4" /></Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "active")} title="Reactivar"><ShieldCheck className="w-4 h-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={editing.full_name || ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
              <div><Label>Institución</Label><Input value={editing.institution || ""} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} /></div>
              <div>
                <Label>Rol</Label>
                <Select value={editing.role || ""} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Sin rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Estudiante</SelectItem>
                    <SelectItem value="teacher">Docente</SelectItem>
                    <SelectItem value="institution">Institución</SelectItem>
                    <SelectItem value="super_admin">Admin General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={updateProfile}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog {...confirm} onOpenChange={(o) => setConfirm((c) => ({ ...c, open: o }))} />
    </div>
  );
}