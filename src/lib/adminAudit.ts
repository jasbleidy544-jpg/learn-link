import { supabase } from "@/integrations/supabase/client";

export async function logAdminAction(
  action: string,
  entity_type?: string,
  entity_id?: string,
  details: Record<string, any> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action,
    entity_type,
    entity_id,
    details,
  });
}

export function exportToCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          if (v == null) return "";
          const s = typeof v === "object" ? JSON.stringify(v) : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}