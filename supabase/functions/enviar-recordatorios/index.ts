import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = Date.now();
  const inThreeDays = new Date(now + 3 * 86400000).toISOString();
  const past = new Date(now - 3600000).toISOString();

  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("id, host_id, student_id, title, scheduled_at, meet_link, status, recordatorio_24h, recordatorio_1h")
    .eq("status", "scheduled")
    .gte("scheduled_at", past)
    .lte("scheduled_at", inThreeDays);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hostIds = Array.from(new Set((meetings || []).map((m: any) => m.host_id)));
  const { data: hosts } = await supabase.from("profiles").select("id, full_name").in("id", hostIds);
  const nameMap = new Map((hosts || []).map((h: any) => [h.id, h.full_name || "tu docente"]));

  let sent24 = 0, sent1 = 0;
  for (const m of meetings || []) {
    if (!m.meet_link) continue;
    const diffMs = new Date(m.scheduled_at).getTime() - now;
    const hours = diffMs / 3600000;
    const minutes = diffMs / 60000;
    const teacher = nameMap.get(m.host_id) || "tu docente";
    const when = new Date(m.scheduled_at).toLocaleString();

    if (!m.recordatorio_24h && hours >= 23 && hours <= 25) {
      await supabase.from("student_notifications").insert({
        student_id: m.student_id, sender_id: m.host_id, type: "meeting",
        title: "⏰ Mentoría mañana",
        message: `Recuerda que mañana tienes una sesión con ${teacher}: "${m.title}".`,
        body: `Recuerda que mañana (${when}) tienes una sesión con ${teacher}: "${m.title}". ¡No lo olvides!`,
        link: m.meet_link,
      });
      await supabase.from("meetings").update({ recordatorio_24h: true }).eq("id", m.id);
      sent24++;
    }
    if (!m.recordatorio_1h && minutes >= 55 && minutes <= 65) {
      await supabase.from("student_notifications").insert({
        student_id: m.student_id, sender_id: m.host_id, type: "meeting",
        title: "🔴 Tu mentoría es en 1 hora",
        message: `En menos de una hora tienes sesión con ${teacher}: "${m.title}".`,
        body: `En menos de una hora tienes sesión con ${teacher}: "${m.title}". ¡Prepárate!`,
        link: m.meet_link,
      });
      await supabase.from("meetings").update({ recordatorio_1h: true }).eq("id", m.id);
      sent1++;
    }
  }

  return new Response(JSON.stringify({ ok: true, checked: meetings?.length || 0, sent24, sent1 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});