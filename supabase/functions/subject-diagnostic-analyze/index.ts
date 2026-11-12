import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const SYSTEM = `Eres un tutor empático para estudiantes colombianos en riesgo de deserción escolar. Diseñas caminos de aprendizaje muy graduales, con lenguaje simple y ejemplos cotidianos. NUNCA asumes que el estudiante domina los temas de su grado.`;

type TopicResult = { tema: string; porcentaje: number; estado: "Dominado" | "En desarrollo" | "Reforzar" };

function estadoFor(pct: number): TopicResult["estado"] {
  if (pct >= 75) return "Dominado";
  if (pct >= 50) return "En desarrollo";
  return "Reforzar";
}

/**
 * Calcula el desempeño REAL por tema a partir de las respuestas del estudiante
 * (no lo decide la IA, para que los porcentajes vengan de evidencia real, no de
 * una estimación — tal como lo pide explícitamente la recomendación funcional).
 */
function computeTopicResults(ejercicios: any[]): { topics: TopicResult[]; overallPct: number } {
  const byTopic = new Map<string, { correct: number; total: number }>();
  let totalCorrect = 0;
  for (const ej of ejercicios) {
    const tema = ej.tema || ej.concepto || "General";
    const acertada = !!ej.acertada;
    const bucket = byTopic.get(tema) || { correct: 0, total: 0 };
    bucket.total += 1;
    if (acertada) { bucket.correct += 1; totalCorrect += 1; }
    byTopic.set(tema, bucket);
  }
  const topics: TopicResult[] = Array.from(byTopic.entries()).map(([tema, { correct, total }]) => {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { tema, porcentaje: pct, estado: estadoFor(pct) };
  });
  const overallPct = ejercicios.length > 0 ? Math.round((totalCorrect / ejercicios.length) * 100) : 0;
  return { topics, overallPct };
}

function nivelFor(pct: number): "Básico" | "Intermedio" | "Avanzado" {
  if (pct < 40) return "Básico";
  if (pct < 70) return "Intermedio";
  return "Avanzado";
}

function buildPrompt(
  subject: string,
  grade: string,
  cuestionario: any,
  ejercicios: any[],
  topicResults: TopicResult[],
  overallPct: number,
  nivel: string,
  historial: { fecha: string; overall_pct: number }[]
) {
  const reforzar = topicResults.filter((t) => t.estado === "Reforzar").map((t) => t.tema);
  const dominados = topicResults.filter((t) => t.estado === "Dominado").map((t) => t.tema);
  const historialTxt = historial.length
    ? `Diagnósticos anteriores en esta materia: ${historial.map((h) => `${h.fecha}: ${h.overall_pct}%`).join(" → ")}.`
    : "Este es su primer diagnóstico en esta materia.";

  return `Materia: ${subject}
Grado: ${grade || "no especificado"}
Nivel general calculado (evidencia real): ${nivel} (${overallPct}%)

Resultados por tema (ya calculados a partir de evidencia real, no los recalcules):
${JSON.stringify(topicResults, null, 2)}

Temas dominados: ${dominados.join(", ") || "ninguno aún"}
Temas a reforzar: ${reforzar.join(", ") || "ninguno"}

${historialTxt}

Cuestionario abierto del estudiante:
${JSON.stringify(cuestionario, null, 2)}

Analiza y devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin texto extra) con esta forma exacta:
{
  "perfil": string,
  "mensaje_motivacional": string,
  "recomendacion_ia": string,
  "camino": [
    {
      "nombre": "🌱 Principiante" | "📚 Intermedio" | "⚡ Avanzado" | "🏆 Experto",
      "descripcion": string,
      "dificultad": "Fácil" | "Media" | "Difícil" | "Muy Difícil",
      "actividades": [
        {
          "tipo": "pregunta",
          "contenido": string,
          "opciones": [string, string, string, string, "No estoy seguro/a"],
          "respuesta_correcta": 0,
          "explicacion": string,
          "concepto": string
        }
      ]
    }
  ]
}

REGLAS ESTRICTAS:
- camino: EXACTAMENTE 4 niveles en este orden: "🌱 Principiante", "📚 Intermedio", "⚡ Avanzado", "🏆 Experto".
- Cada nivel: EXACTAMENTE 8 actividades.
- El nivel "🌱 Principiante" debe enfocarse PRIORITARIAMENTE en los temas a reforzar (${reforzar.join(", ") || "temas básicos"}).
- Empieza desde lo MUY básico (vida cotidiana), sube dificultad de forma MUY gradual entre niveles. Nunca saltes de golpe.
- Usa situaciones reales: dinero, comida, deporte, casa, redes sociales, viajes.
- NO uses derivadas, ecuaciones complejas ni jerga académica.
- Cada pregunta: 5 opciones (4 reales + "No estoy seguro/a" como última). respuesta_correcta es índice 0-3.
- "concepto": etiqueta corta (2-3 palabras) del tema evaluado, idealmente uno de los temas a reforzar.
- "explicacion": clara, con ejemplo cotidiano.
- "perfil": 2 frases personalizadas y motivadoras, mencionando su nivel actual.
- "mensaje_motivacional": cálido, cercano, en segunda persona, máximo 2 frases.
- "recomendacion_ia": 2-3 frases indicando CUÁL es el tema prioritario a reforzar y cómo empezar (enfoque gradual). Si hay historial previo y el estudiante mejoró, menciona explícitamente cuántos puntos mejoró (por ejemplo "📈 Has mejorado X puntos desde tu diagnóstico anterior.").`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, grade, cuestionario, ejercicios } = await req.json();
    if (!subject) throw new Error("subject requerido");
    const ejerciciosArr = Array.isArray(ejercicios) ? ejercicios : [];

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY no configurada");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Calcular desempeño real por tema (evidencia real, no estimación de la IA).
    const { topics: topicResults, overallPct } = computeTopicResults(ejerciciosArr);
    const nivel = nivelFor(overallPct);

    // 2. Historial previo de esta materia (para comparar diagnósticos y detectar mejoras reales).
    const { data: prevDiagnostics } = await admin
      .from("subject_diagnostics")
      .select("overall_pct, created_at")
      .eq("user_id", user.id)
      .eq("subject", subject)
      .order("created_at", { ascending: true });

    const historial = (prevDiagnostics || []).map((d: any) => ({
      fecha: new Date(d.created_at).toLocaleDateString("es-CO"),
      overall_pct: d.overall_pct ?? 0,
    }));

    // 3. Perfil existente (para no pisar camino/current_level/diagnostico_inicial en reevaluaciones).
    const { data: existingJourney } = await admin
      .from("subject_journeys")
      .select("id, camino, current_level, diagnostico_inicial_pct")
      .eq("user_id", user.id)
      .eq("subject", subject)
      .maybeSingle();

    // 4. IA genera perfil, recomendación, mensaje y camino gamificado.
    const aiResp = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt(subject, grade, cuestionario, ejerciciosArr, topicResults, overallPct, nivel, historial) },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      throw new Error("Error IA");
    }

    const aiData = await aiResp.json();
    const raw = aiData?.choices?.[0]?.message?.content ?? "{}";
    let result: any;
    try { result = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      result = m ? JSON.parse(m[0]) : {};
    }

    const temasFuertes = topicResults.filter((t) => t.estado === "Dominado").map((t) => t.tema);
    const temasAReforzar = topicResults.filter((t) => t.estado !== "Dominado").map((t) => t.tema);

    // 5. Guardar el registro histórico de este diagnóstico (append-only, nunca se borra).
    await admin.from("subject_diagnostics").insert({
      user_id: user.id,
      subject,
      grade: grade || null,
      cuestionario: cuestionario || {},
      ejercicios: ejerciciosArr,
      preguntas_tags: ejerciciosArr,
      topic_results: topicResults,
      overall_pct: overallPct,
    });

    // 6. Actualizar el perfil de la materia:
    //    - Si es la primera vez: crear con camino nuevo, current_level=1 y diagnóstico inicial.
    //    - Si ya existía: actualizar solo el perfil/temas/recomendación, SIN tocar el camino
    //      gamificado ni el nivel actual (para no eliminar historial ni alterar progreso ya hecho).
    let journey;
    if (!existingJourney) {
      const payload = {
        user_id: user.id,
        subject,
        nivel,
        temas_fuertes: temasFuertes,
        temas_a_reforzar: temasAReforzar,
        perfil: result.perfil || "",
        mensaje_motivacional: result.mensaje_motivacional || "",
        camino: result.camino || [],
        current_level: 1,
        topic_results: topicResults,
        diagnostico_inicial_pct: overallPct,
        ultima_evaluacion_pct: overallPct,
        recomendacion_ia: result.recomendacion_ia || "",
      };
      const { data: created, error: insErr } = await admin
        .from("subject_journeys")
        .insert(payload)
        .select()
        .maybeSingle();
      if (insErr) throw insErr;
      journey = created;
    } else {
      const { data: updated, error: updErr } = await admin
        .from("subject_journeys")
        .update({
          nivel,
          temas_fuertes: temasFuertes,
          temas_a_reforzar: temasAReforzar,
          perfil: result.perfil || "",
          mensaje_motivacional: result.mensaje_motivacional || "",
          topic_results: topicResults,
          ultima_evaluacion_pct: overallPct,
          recomendacion_ia: result.recomendacion_ia || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingJourney.id)
        .select()
        .maybeSingle();
      if (updErr) throw updErr;
      journey = updated;
    }

    return new Response(JSON.stringify({ ok: true, journey, topic_results: topicResults, overall_pct: overallPct }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
