import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/adminAudit";
import { Download } from "lucide-react";

export default function AdminAudit() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(500);
      setList(data || []);
    })();
  }, []);

  const filtered = list.filter((r) => !q || r.action.toLowerCase().includes(q.toLowerCase()) || (r.entity_type || "").includes(q));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Auditoría</h1><p className="text-muted-foreground">Historial de acciones administrativas</p></div>
        <Button variant="outline" onClick={() => exportToCSV(filtered, "auditoria.csv")}><Download className="w-4 h-4 mr-2" />Exportar</Button>
      </div>
      <Card className="cloud-card">
        <CardHeader><Input placeholder="Filtrar por acción o entidad..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" /></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>Detalles</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                  <TableCell className="text-sm">{r.entity_type} <span className="text-xs text-muted-foreground">{r.entity_id?.slice(0,8)}</span></TableCell>
                  <TableCell className="text-xs font-mono max-w-md truncate">{JSON.stringify(r.details)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}