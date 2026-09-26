import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const ANALYSIS_PROMPT = `Eres un analista educativo de LearnLink especializado en prevención de deserción escolar.

Recibirás las respuestas estructuradas del diagnóstico inicial de un estudiante, agrupadas por bloques (emocional, social, académico, motivación).

Tu tarea: analizarlas con empatía y devolver EXCLUSIVAMENTE un JSON válido (sin texto adicional, sin markdown, sin \`\`\`) con esta forma exacta:

{
  "areas_fortaleza": [string, ...],
  "areas_riesgo": [string, ...],
  "nivel_riesgo": "alto" | "medio" | "bajo",
  "recomendaciones": [
    { "titulo": string, "descripcion": string, "acciones": [string, ...] }
  ],
  "resumen_para_docente": string,
  "etiquetas": [string, ...]
}

Criterios:
- nivel_riesgo "alto": señales emocionales graves (tristeza profunda, aislamiento fuerte), repitencia + falta de apoyo, ausencia de metas claras, sentirse excluido de forma sostenida.
- nivel_riesgo "medio": dificultades académicas o emocionales moderadas con red de apoyo parcial.
- nivel_riesgo "bajo": buena adaptación general, metas claras, apoyo social.

- areas_fortaleza: 2-4 puntos (ej: "Buena red de amigos", "Motivación por aprender").
- areas_riesgo: 2-5 puntos (ej: "Falta de rutina de estudio", "Estrés por exámenes").
- recomendaciones: 3-5 acciones accionables y específicas. Cada una con título corto, descripción (1-2 frases) y 2-4 acciones concretas.
- resumen_para_docente: 2-3 frases profesionales que resuman al estudiante.
- etiquetas: 3-6 etiquetas cortas para clasificar al estudiante (ej: "apoyo_emocional", "reforzar_matematicas", "orientacion_vocacional", "necesita_mentoria", "buen_social").`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { respuestas, diagnosticoId } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

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

    const aiResp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: JSON.stringify(respuestas, null, 2) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Groq finalize error", aiResp.status, t);
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

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Guardar en diagnosticos
    let id = diagnosticoId;
    const payload = {
      user_id: user.id,
      respuestas,
      resultado,
      status: "completed",
      nivel_riesgo: resultado?.nivel_riesgo || "bajo",
      completed_at: new Date().toISOString(),
    };

    if (id) {
      await admin.from("diagnosticos").update(payload).eq("id", id).eq("user_id", user.id);
    } else {
      const { data } = await admin.from("diagnosticos").insert(payload).select("id").maybeSingle();
      id = data?.id;
    }

    // Actualizar profiles
    await admin.from("profiles").update({
      diagnostico_completado: true,
      diagnostico_ultima_fecha: new Date().toISOString(),
    }).eq("id", user.id);

    // Crear recomendaciones
    const recs = Array.isArray(resultado?.recomendaciones) ? resultado.recomendaciones : [];
    if (recs.length) {
      const priority =
        resultado?.nivel_riesgo === "alto" ? "high" :
        resultado?.nivel_riesgo === "medio" ? "medium" : "low";

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