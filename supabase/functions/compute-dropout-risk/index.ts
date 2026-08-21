import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Eres un tutor empático para estudiantes colombianos en riesgo de deserción escolar. Usa lenguaje simple, ejemplos cotidianos y siempre un tono motivador y cercano. Nunca uses términos técnicos sin explicarlos antes.`;

type RiskLevel = "low" | "medium" | "high";

function classify(daysSince: number, progressPct: number, abandonedRatio: number) {
  // Hard rules from product spec
  if (daysSince > 7 || progressPct < 20) return { level: "high" as RiskLevel, score: 80 };
  if (progressPct < 60 || abandonedRatio > 0.3) return { level: "medium" as RiskLevel, score: 55 };
  return { level: "low" as RiskLevel, score: 25 };
}

async function computeForStudent(admin: any, llmKey: string, studentId: string) {
  const [{ data: profile }, { data: journeys }, { data: progresses }, { data: inters }, { data: diags }] = await Promise.all([
    admin.from("profiles").select("id, full_name, grade, institution_id, last_sign_in_at, created_at").eq("id", studentId).maybeSingle(),
    admin.from("subject_journeys").select("subject, camino, current_level").eq("user_id", studentId),
    admin.from("subject_level_progress").select("subject, level_index, score, completed_at").eq("user_id", studentId),
    admin.from("platform_interactions").select("interaction_type, created_at").eq("user_id", studentId).order("created_at", { ascending: false }).limit(100),
    admin.from("subject_diagnostics").select("subject, ejercicios").eq("user_id", studentId),
  ]);

  if (!profile) return null;

  const lastSeen = profile.last_sign_in_at ? new Date(profile.last_sign_in_at) : (profile.created_at ? new Date(profile.created_at) : null);
  const daysSince = lastSeen ? Math.max(0, Math.floor((Date.now() - lastSeen.getTime()) / 86400000)) : 999;

  // Progress %: completed/passed levels vs total levels in caminos
  let totalLevels = 0;
  let completedLevels = 0;
  const subjectTotals: Record<string, number> = {};
  (journeys || []).forEach((j: any) => {
    const n = Array.isArray(j.camino) ? j.camino.length : 0;
    totalLevels += n;
    subjectTotals[j.subject] = n;
  });
  (progresses || []).forEach((p: any) => {
    if (p?.score?.passed) completedLevels += 1;
  });
  const progressPct = totalLevels ? Math.round((completedLevels / totalLevels) * 100) : 0;

  // Activities completed vs abandoned (use platform_interactions)
  const completed = (inters || []).filter((i: any) => i.interaction_type === "level_completed" || i.interaction_type === "activity_completed").length;
  const abandoned = (inters || []).filter((i: any) => i.interaction_type === "level_abandoned" || i.interaction_type === "activity_abandoned").length;
  const abandonedRatio = (completed + abandoned) > 0 ? abandoned / (completed + abandoned) : 0;

  // Velocity: progress events in last 7 days
  const sevenAgo = Date.now() - 7 * 86400000;
  const recent = (progresses || []).filter((p: any) => p.completed_at && new Date(p.completed_at).getTime() >= sevenAgo).length;

  // Diagnostic difficulty: average wrong ratio
  let diagWrong = 0, diagTotal = 0;
  (diags || []).forEach((d: any) => {
    (Array.isArray(d.ejercicios) ? d.ejercicios : []).forEach((e: any) => {
      diagTotal += 1;
      if (e && e.correcto === false) diagWrong += 1;
    });
  });
  const diagDifficulty = diagTotal ? Math.round((diagWrong / diagTotal) * 100) : 0;

  const { level, score } = classify(daysSince, progressPct, abandonedRatio);

  const factors = {
    days_since_last_sign_in: daysSince,
    progress_pct: progressPct,
    completed_levels: completedLevels,
    total_levels: totalLevels,
    activities_completed: completed,
    activities_abandoned: abandoned,
    abandoned_ratio: Number(abandonedRatio.toFixed(2)),
    recent_progress_events_7d: recent,
    diagnostic_difficulty_pct: diagDifficulty,
    subjects: subjectTotals,
  };

  // Ask LLM for the human note
  let aiNote = "";
  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${llmKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Genera una nota breve (máximo 3 frases, español, tono cercano) para un docente/coordinador que describa la situación del estudiante "${profile.full_name || "Estudiante"}" del grado ${profile.grade || "—"} y recomiende una acción.\n\nDatos del estudiante (riesgo calculado: ${level}):\n${JSON.stringify(factors, null, 2)}\n\nResponde SOLO con la nota descriptiva, sin viñetas, sin encabezados.` },
        ],
      }),
    });
    if (aiResp.ok) {
      const aiData = await aiResp.json();
      aiNote = (aiData?.choices?.[0]?.message?.content ?? "").trim();
    } else if (aiResp.status === 429 || aiResp.status === 402) {
      aiNote = level === "high"
        ? "Estudiante en riesgo alto. Se recomienda intervención inmediata de un docente voluntario."
        : level === "medium"
          ? "Estudiante con actividad irregular. Se recomienda seguimiento cercano esta semana."
          : "Estudiante con buen ritmo de avance. Mantén el acompañamiento habitual.";
    }
  } catch (e) {
    console.error("LLM note error", e);
  }

  await admin.from("student_risk").upsert({
    user_id: studentId,
    institution_id: profile.institution_id,
    risk_level: level,
    risk_score: score,
    ai_note: aiNote,
    factors,
    computed_at: new Date().toISOString(),
  });

  return { user_id: studentId, risk_level: level, risk_score: score };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    const caller = u?.user;
    if (!caller) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({} as any));
    const { user_id, institution_id, cron } = body || {};

    let targets: string[] = [];

    if (cron === true) {
      // Service-only path called from pg_cron with service key auth header
      const { data: all } = await admin.from("profiles").select("id, institution_id").not("institution_id", "is", null);
      targets = (all || []).map((r: any) => r.id);
    } else if (institution_id) {
      // Verify caller owns the institution OR is super_admin
      const { data: inst } = await admin.from("institutions").select("id, owner_id").eq("id", institution_id).maybeSingle();
      const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
      const isSuper = (roleRow || []).some((r: any) => r.role === "super_admin");
      if (!inst || (inst.owner_id !== caller.id && !isSuper)) {
        return new Response(JSON.stringify({ error: "Sin permisos" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: members } = await admin.from("profiles").select("id").eq("institution_id", institution_id);
      targets = (members || []).map((m: any) => m.id);
    } else {
      // Default: recompute for the caller (student self-trigger)
      targets = [user_id || caller.id];
    }

    const results: any[] = [];
    for (const t of targets) {
      try {
        const r = await computeForStudent(admin, LOVABLE_API_KEY, t);
        if (r) results.push(r);
      } catch (e) {
        console.error("compute err for", t, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});