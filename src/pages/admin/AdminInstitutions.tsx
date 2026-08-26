import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { logAdminAction, exportToCSV } from "@/lib/adminAudit";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Pencil, Trash2, Download, Search, RefreshCw, Copy, Eye } from "lucide-react";
import { generateInstitutionCode } from "@/utils/codeGenerator";

// Tipo simplificado para evitar conflictos
type Institution = {
  id?: string;
  name: string;
  code?: string;
  city?: string;
  department?: string;
  admin_id?: string | null;
  admin_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status: string;
  notes?: string;
  student_code?: string;
  teacher_code?: string;
  created_at?: string;
};

type AdminOption = {
  id: string;
  full_name: string;
  email: string;
};

export default function AdminInstitutions() {
  const { toast } = useToast();
  const [list, setList] = useState<Institution[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Institution | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(false);

  // =============================================
  // CARGA DE DATOS (con "as any" para evitar errores de tipo)
  // =============================================
  const load = async () => {
    setLoading(true);

    // 1. Obtener instituciones
    const { data, error } = await supabase
      .from("institutions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // 2. Obtener nombres de administradores (usando "as any")
    const adminIds = (data as any[])?.map(inst => inst.admin_id).filter(Boolean) || [];
    let adminNames: Record<string, string> = {};
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", adminIds);
      if (profiles) {
        adminNames = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
      }
    }

    // 3. Mapear instituciones con nombre del administrador
    const mapped = (data || []).map((inst: any) => ({
      ...inst,
      admin_name: inst.admin_id ? (adminNames[inst.admin_id] || "Sin asignar") : "Sin asignar"
    }));
    setList(mapped);

    // 4. Cargar lista de administradores disponibles (usuarios con rol 'institution')
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "institution");

    const adminIdsList = rolesData?.map(r => r.user_id) || [];
    if (adminIdsList.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminIdsList);
      setAdmins(profilesData || []);
    } else {
      setAdmins([]);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // =============================================
  // GUARDAR (CREAR / EDITAR)
  // =============================================
  const save = async () => {
    if (!editing) return;
    if (!editing.name) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    // Si es nueva, generar código automáticamente
    if (!editing.id) {
      editing.code = generateInstitutionCode(editing.name);
    }

    const payload: any = {
      name: editing.name,
      code: editing.code || null,
      city: editing.city || null,
      department: editing.department || null,
      admin_id: editing.admin_id || null,
      status: editing.status || 'active',
      contact_email: editing.contact_email || null,
      contact_phone: editing.contact_phone || null,
      address: editing.address || null,
      notes: editing.notes || null,
    };

    if (editing.id) {
      const { error } = await supabase
        .from("institutions")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      await logAdminAction("update_institution", "institution", editing.id);
    } else {
      const { data, error } = await supabase
        .from("institutions")
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      await logAdminAction("create_institution", "institution", data?.id);
    }

    toast({ title: "Guardado" });
    setEditing(null);
    load();
  };

  // =============================================
  // CAMBIAR ESTADO (ACTIVAR / INACTIVAR)
  // =============================================
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("institutions")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await logAdminAction(`institution_${status}`, "institution", id);
    toast({ title: status === "active" ? "Activada" : "Inactivada" });
    load();
  };

  // =============================================
  // ELIMINAR
  // =============================================
  const remove = async () => {
    if (!del) return;
    const { error } = await supabase
      .from("institutions")
      .delete()
      .eq("id", del);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await logAdminAction("delete_institution", "institution", del);
    toast({ title: "Eliminada" });
    setDel(null);
    load();
  };

  // =============================================
  // REGENERAR CÓDIGOS (estudiante / docente)
  // =============================================
  const regenerate = async (id: string, which: "student" | "teacher") => {
    const { data, error } = await supabase.rpc("regenerate_institution_code", { 
      _institution_id: id, 
      _which: which 
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await logAdminAction(`regenerate_${which}_code`, "institution", id, { new_code: data });
    toast({ title: "Código regenerado", description: data });
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado", description: code });
  };

  // =============================================
  // FILTRADO Y RENDER
  // =============================================
  const filtered = list.filter((i) =>
    i.name.toLowerCase().includes(q.toLowerCase()) ||
    (i.code && i.code.toLowerCase().includes(q.toLowerCase())) ||
    (i.city && i.city.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏫 Instituciones</h1>
          <p className="text-muted-foreground">{filtered.length} instituciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(filtered, "instituciones.csv")}>
            <Download className="w-4 h-4 mr-2" />Exportar
          </Button>
          <Button onClick={() => setEditing({ 
            name: "", 
            code: "", 
            city: "", 
            department: "", 
            admin_id: null, 
            status: "active" 
          })}>
            <Plus className="w-4 h-4 mr-2" />Nueva
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card className="cloud-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10" 
              placeholder="Buscar por nombre, código o ciudad..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay instituciones</TableCell></TableRow>
              ) : (
                filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{i.code || "—"}</code>
                    </TableCell>
                    <TableCell>{i.city || "—"}</TableCell>
                    <TableCell>{i.admin_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={i.status === "active" ? "default" : "secondary"}>
                        {i.status === "active" ? "🟢 Activa" : "⚪ Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => {}} title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {i.status === "active" ? (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(i.id!, "inactive")} title="Desactivar">
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(i.id!, "active")} title="Activar">
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEditing(i)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDel(i.id!)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de creación/edición */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar institución" : "Nueva institución"}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Complete los datos de la institución.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <Label>Nombre *</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => {
                    const newName = e.target.value;
                    setEditing({ 
                      ...editing, 
                      name: newName,
                      ...(editing.id ? {} : { code: generateInstitutionCode(newName) })
                    });
                  }} 
                />
              </div>

              {/* Código institucional */}
              <div>
                <Label>Código institucional</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={editing.code || ""} 
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                    placeholder="Se genera automáticamente"
                    disabled={!editing.id}
                  />
                  {editing.id && (
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditing({ ...editing, code: generateInstitutionCode(editing.name) });
                    }}>
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Código único que identifica a la institución.</p>
              </div>

              {/* Ciudad y Departamento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ciudad</Label>
                  <Input 
                    value={editing.city || ""} 
                    onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Input 
                    value={editing.department || ""} 
                    onChange={(e) => setEditing({ ...editing, department: e.target.value })}
                  />
                </div>
              </div>

              {/* Administrador institucional */}
              <div>
                <Label>Administrador institucional</Label>
                <Select
                  value={editing.admin_id || "none"}
                  onValueChange={(val) => setEditing({ ...editing, admin_id: val === "none" ? null : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar administrador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {admins.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.full_name} ({a.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">El administrador podrá gestionar esta institución.</p>
              </div>

              {/* Estado */}
              <div>
                <Label>Estado</Label>
                <Select
                  value={editing.status || "active"}
                  onValueChange={(val) => setEditing({ ...editing, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">🟢 Activa</SelectItem>
                    <SelectItem value="inactive">⚪ Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email de contacto</Label>
                  <Input 
                    value={editing.contact_email || ""} 
                    onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input 
                    value={editing.contact_phone || ""} 
                    onChange={(e) => setEditing({ ...editing, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <Label>Dirección</Label>
                <Input 
                  value={editing.address || ""} 
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación para eliminar */}
      <ConfirmDialog 
        open={!!del} 
        onOpenChange={(o) => !o && setDel(null)} 
        title="¿Eliminar institución?" 
        description="Esta acción no se puede deshacer." 
        destructive 
        confirmText="Eliminar" 
        onConfirm={remove} 
      />
    </div>
  );
}