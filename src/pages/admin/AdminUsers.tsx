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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type UserRole = 'student' | 'institution' | 'teacher' | 'super_admin';

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  institution_id: string | null;
  institution_name?: string;
  created_at: string;
  last_sign_in_at: string | null;
};

type InstitutionOption = {
  id: string;
  name: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: 'student' as UserRole,
    institution_id: null as string | null,
  });

  const loadData = async () => {
    setLoading(true);
    const { data: instData } = await supabase
      .from("institutions")
      .select("id, name")
      .eq("status", "active");
    setInstitutions(instData || []);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        institution_id,
        created_at,
        last_sign_in_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const userIds = profiles?.map(p => p.id) || [];
    let rolesMap: Record<string, UserRole> = {};
    if (userIds.length > 0) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      rolesMap = Object.fromEntries((roles || []).map(r => [r.user_id, r.role as UserRole]));
    }

    const instIds = profiles?.map(p => p.institution_id).filter(Boolean) || [];
    let instNames: Record<string, string> = {};
    if (instIds.length > 0) {
      const { data: insts } = await supabase
        .from("institutions")
        .select("id, name")
        .in("id", instIds);
      instNames = Object.fromEntries((insts || []).map(i => [i.id, i.name]));
    }

    const mapped = (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || "",
      email: p.email || "",
      role: rolesMap[p.id] || 'student',
      institution_id: p.institution_id || null,
      institution_name: p.institution_id ? instNames[p.institution_id] || null : null,
      created_at: p.created_at,
      last_sign_in_at: p.last_sign_in_at,
    }));

    setUsers(mapped);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateOrUpdate = async () => {
    if (isCreating) {
      if (!formData.email || !formData.password || !formData.full_name) {
        toast.error("Email, contraseña y nombre son obligatorios");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { full_name: formData.full_name },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: formData.full_name,
          email: formData.email,
          institution_id: formData.institution_id || null,
        });

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: formData.role,
        });

      if (roleError) {
        toast.error(roleError.message);
        return;
      }

      toast.success("Usuario creado exitosamente");
    } else {
      if (!editing) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editing.full_name,
          institution_id: editing.institution_id,
        })
        .eq("id", editing.id);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Usuario actualizado");
    }

    setIsCreating(false);
    setEditing(null);
    setFormData({ email: "", password: "", full_name: "", role: 'student', institution_id: null });
    loadData();
  };

  const handleDelete = async () => {
    if (!del) return;
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", del);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("user_roles").delete().eq("user_id", del);
    toast.success("Usuario eliminado");
    setDel(null);
    setConfirmDeleteOpen(false);
    loadData();
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      super_admin: { label: "🔴 Super Admin", variant: "destructive" },
      institution: { label: "🏢 Institución", variant: "default" },
      teacher: { label: "👨‍🏫 Docente", variant: "secondary" },
      student: { label: "🎓 Estudiante", variant: "outline" },
    };
    const info = map[role] || { label: role, variant: "outline" };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const openCreateDialog = () => {
    setIsCreating(true);
    setEditing(null);
    setFormData({ email: "", password: "", full_name: "", role: 'student', institution_id: null });
  };

  const openEditDialog = (user: UserProfile) => {
    setIsCreating(false);
    setEditing(user);
    setFormData({
      email: user.email,
      password: "",
      full_name: user.full_name,
      role: user.role,
      institution_id: user.institution_id,
    });
  };

  const openDeleteConfirm = (id: string) => {
    setDel(id);
    setConfirmDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👥 Usuarios</h1>
          <p className="text-muted-foreground">{filtered.length} usuarios registrados</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      <Card className="cloud-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar por nombre, email o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay usuarios</TableCell></TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{u.institution_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(u)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openDeleteConfirm(u.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar usuario?"
        description="Esta acción eliminará el perfil y el rol del usuario. No se puede deshacer."
        confirmText="Eliminar"
        destructive
        onConfirm={handleDelete}
      />

      {/* Modal de creación/edición */}
      <Dialog open={isCreating || !!editing} onOpenChange={(o) => {
        if (!o) {
          setIsCreating(false);
          setEditing(null);
          setFormData({ email: "", password: "", full_name: "", role: 'student', institution_id: null });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Crear usuario" : "Editar usuario"}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Ingresa los datos del nuevo usuario." : "Modifica los datos del usuario."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isCreating}
              />
            </div>
            {isCreating && (
              <div>
                <Label>Contraseña *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label>Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(val: UserRole) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">🎓 Estudiante</SelectItem>
                  <SelectItem value="teacher">👨‍🏫 Docente</SelectItem>
                  <SelectItem value="institution">🏢 Administrador institucional</SelectItem>
                  <SelectItem value="super_admin">🔴 Super Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Institución (opcional)</Label>
              <Select
                value={formData.institution_id || "none"}
                onValueChange={(val) => setFormData({ ...formData, institution_id: val === "none" ? null : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin institución</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreating(false);
              setEditing(null);
              setFormData({ email: "", password: "", full_name: "", role: 'student', institution_id: null });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {isCreating ? "Crear" : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}