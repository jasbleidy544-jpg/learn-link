import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const SYSTEM = `Eres un diseñador de diagnósticos educativos para estudiantes colombianos de educación básica secundaria y media, muchos en riesgo de deserción escolar. NUNCA asumes que el estudiante domina los temas de su grado. Generas preguntas claras, contextualizadas y nunca técnicas o universitarias.`;

/** Mapea un texto de grado libre ("9°", "grado 10", "11") a la banda curricular del MEN. */
function gradeToBand(grade: string | undefined | null): "6-7" | "8-9" | "10-11" {
  const n = parseInt((grade || "").replace(/[^0-9]/g, ""), 10);
  if (n >= 6 && n <= 7) return "6-7";
  if (n >= 8 && n <= 9) return "8-9";
  if (n >= 10 && n <= 11) return "10-11";
  return "8-9";
}

type CurriculumTopic = { topic: string; competencia: string };

function buildMainPrompt(subject: string, grade: string, band: string, topics: CurriculumTopic[], count: number) {
  const topicsList = topics
    .map((t, i) => `${i + 1}. Tema: "${t.topic}" · Competencia: "${t.competencia}"`)
    .join("\n");

  return `Asignatura: ${subject}
Grado del estudiante: ${grade || "no especificado"} (banda curricular ${band})
Nivel esperado: educación básica secundaria / media colombiana.
Objetivo: identificar conocimientos previos, aplicación y dificultades específicas por tema.

Temas y competencias que corresponden a este grado según el currículo (Estándares/DBA del MEN), de los que la IA DEBE elegir (no inventes temas fuera de esta lista):
${topicsList}

Genera EXACTAMENTE ${count} preguntas de diagnóstico, distribuidas entre los temas de la lista (cubre varios temas, no solo uno), usando EXACTAMENTE estos 4 tipos de pregunta, rotando entre ellos:
- "reconocimiento": comprueba si conoce el concepto (situación simple, no definición).
- "aplicacion": comprueba si puede usar lo aprendido en un cálculo o procedimiento directo.
- "situacion": comprueba si puede aplicar el conocimiento a una situación cotidiana (tienda, dinero, deporte, casa, redes sociales).
- "razonamiento": comprueba si entiende el concepto y no solo memoriza (ej. comparar dos respuestas y decidir cuál tiene sentido).

REGLAS CRÍTICAS:
- Antes de escribir cada pregunta, pregúntate: "¿qué debería saber razonablemente un estudiante de este grado sobre este tema?". NUNCA preguntes contenido de un grado superior ni de nivel universitario.
- Lenguaje sencillo, directo, cercano. NUNCA definiciones puras ("¿Qué es...?") ni fórmulas complejas sin contexto.
- La dificultad debe subir progresivamente: las primeras preguntas básicas, las últimas más aplicadas.
- Usa situaciones reales: dinero, comida, deporte, casa, redes sociales, viajes.
- Cada pregunta tiene 5 opciones: 4 reales + "No estoy seguro/a" como última opción siempre.
- "respuesta_correcta" es el índice 0-3 (nunca 4, esa es "No estoy seguro/a").
- "tema" debe ser EXACTAMENTE uno de los temas de la lista de arriba (cópialo tal cual).
- "competencia" debe ser la competencia asociada a ese tema en la lista.
- "dificultad": "Básica", "Intermedia" o "Aplicada" según la progresión.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin texto extra):
{
  "preguntas": [
    {
      "enunciado": string,
      "opciones": [string, string, string, string, "No estoy seguro/a"],
      "respuesta_correcta": 0,
      "explicacion": string,
      "tema": string,
      "competencia": string,
      "dificultad": "Básica" | "Intermedia" | "Aplicada",
      "tipo": "reconocimiento" | "aplicacion" | "situacion" | "razonamiento"
    }
  ]
}`;
}

/** Modo legado (sin currículo): usado por LevelDialog para regenerar preguntas sobre conceptos fallidos puntuales. */
function buildLegacyPrompt(subject: string, topicsHint: string) {
  return `Genera EXACTAMENTE 5 preguntas MUY FÁCILES de la materia "${subject}" para un estudiante colombiano que tiene vacíos grandes en estos conceptos: ${topicsHint}.

REGLAS CRÍTICAS:
- NO asumas que domina los temas. Empieza SIEMPRE desde conceptos básicos y cotidianos.
- Usa situaciones de la vida real (tienda, cocina, casa, deporte, redes sociales, dinero).
- Lenguaje sencillo, cercano, sin tecnicismos.
- Distractores plausibles pero distinguibles con sentido común.
- La 5ª opción de TODAS las preguntas debe ser exactamente "No estoy seguro/a".
- NUNCA uses derivadas, ecuaciones complejas, fórmulas o vocabulario académico avanzado.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown):
{
  "preguntas": [
    { "enunciado": string, "opciones": [string, string, string, string, "No estoy seguro/a"], "respuesta_correcta": 0, "explicacion": string, "concepto": string }
  ]
}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, grade, topics, count } = await req.json();
    if (!subject) throw new Error("subject requerido");

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
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

    // Modo legado: LevelDialog pide preguntas de refuerzo sobre conceptos puntuales (sin grado).
    const isLegacyRegen = !grade && Array.isArray(topics) && topics.length > 0;

    let userPrompt: string;
    let sinBaseCurricular = false;

    if (isLegacyRegen) {
      userPrompt = buildLegacyPrompt(subject, topics.join(", "));
    } else {
      const band = gradeToBand(grade);
      const admin = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      });
      const { data: curriculum, error: curErr } = await admin
        .from("curriculum_topics")
        .select("topic, competencia")
        .eq("subject", subject)
        .eq("grade_band", band)
        .order("orden", { ascending: true });

      if (curErr) throw curErr;

      if (!curriculum || curriculum.length === 0) {
        // No inventamos temas: avisamos y usamos el modo legado como respaldo.
        sinBaseCurricular = true;
        userPrompt = buildLegacyPrompt(subject, topics && topics.length ? topics.join(", ") : "temas generales de " + subject);
      } else {
        const n = Math.max(8, Math.min(12, Number(count) || 10));
        userPrompt = buildMainPrompt(subject, grade, band, curriculum as CurriculumTopic[], n);
      }
    }

    const aiResp = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
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

    const preguntas = (result.preguntas || []).map((p: any) => ({
      ...p,
      // "concepto" se mantiene por compatibilidad con componentes existentes (LevelDialog, JourneyPath, etc.)
      concepto: p.concepto || p.tema || "general",
    }));

    return new Response(JSON.stringify({ preguntas, sinBaseCurricular }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
