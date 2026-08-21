import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `Eres un analista educativo de LearnLink. Te paso la conversación completa del diagnóstico inicial de un estudiante. Analiza con empatía y devuelve EXCLUSIVAMENTE un JSON válido (sin texto adicional, sin markdown, sin \`\`\`) con esta forma exacta:
{
  "areas_fortaleza": [string, ...],
  "areas_riesgo": [string, ...],
  "nivel_riesgo": "alto" | "medio" | "bajo",
  "recomendaciones": [
    { "titulo": string, "descripcion": string, "acciones": [string, ...] }
  ],
  "resumen_para_docente": string
}

Criterios:
- nivel_riesgo alto: señales emocionales graves, aislamiento social fuerte, repitencia + sin apoyo, falta de motivación clara o riesgo personal.
- nivel_riesgo medio: dificultades académicas o emocionales moderadas con red de apoyo parcial.
- nivel_riesgo bajo: buena adaptación general.
- 3 a 5 recomendaciones accionables y específicas.
- resumen_para_docente: 2-3 frases claras y profesionales.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, diagnosticoId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = (messages || [])
      .map((m: any) => `${m.role === "user" ? "Estudiante" : "IA"}: ${m.content}`)
      .join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: transcript },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI finalize error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Error de análisis IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const raw = aiData?.choices?.[0]?.message?.content ?? "{}";
    let resultado: any;
    try { resultado = JSON.parse(raw); }
    catch {
      const match = raw.match(/\{[\s\S]*\}/);
      resultado = match ? JSON.parse(match[0]) : {};
    }

    // Persist with service role to bypass RLS for trusted writes
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Build respuestas grouped by section based on transcript
    const respuestas = {
      transcript: messages,
      generado_en: new Date().toISOString(),
    };

    let id = diagnosticoId;
    if (id) {
      await admin.from("diagnosticos").update({
        respuestas, resultado, status: "completed",
      }).eq("id", id).eq("user_id", user.id);
    } else {
      const { data } = await admin.from("diagnosticos").insert({
        user_id: user.id, respuestas, resultado, status: "completed",
      }).select("id").maybeSingle();
      id = data?.id;
    }

    await admin.from("profiles").update({ diagnostico_completado: true }).eq("id", user.id);

    // Seed AI recommendations from the result
    const recs = Array.isArray(resultado?.recomendaciones) ? resultado.recomendaciones : [];
    if (recs.length) {
      const priority = resultado?.nivel_riesgo === "alto" ? "high"
        : resultado?.nivel_riesgo === "medio" ? "medium" : "low";
      await admin.from("ai_recommendations").insert(
        recs.slice(0, 5).map((r: any) => ({
          student_id: user.id,
          type: "diagnostic",
          title: String(r.titulo || "Recomendación"),
          content: String(r.descripcion || "") +
            (Array.isArray(r.acciones) && r.acciones.length
              ? "\n\n• " + r.acciones.join("\n• ") : ""),
          priority,
        }))
      );
    }

    return new Response(JSON.stringify({ ok: true, id, resultado }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});