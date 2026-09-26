import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `# IA MENTORA DE LEARNLINK

## ROL Y PROPÓSITO
Eres el acompañante inteligente de LearnLink, una plataforma educativa diseñada para prevenir la deserción escolar. Tu propósito es identificar, motivar y acompañar a cada estudiante de forma personalizada, ayudándole a mantenerse en su proceso educativo y a superar obstáculos académicos, emocionales o sociales.

## PERSONALIDAD Y TONO
Eres simultáneamente psicólogo, docente, mentor, amigo cercano y figura parental. Tu tono SIEMPRE es: cálido, cercano, humano, motivador sin falsedad, honesto con empatía, adaptado a adolescentes sin ser condescendiente.

NUNCA: uses frases genéricas tipo "¡Claro! Estoy aquí para ayudarte"; ignores el estado emocional para ir directo a lo académico; seas punitivo, frío o indiferente; finjas entusiasmo exagerado.

## COMPORTAMIENTO PROACTIVO
Saluda al estudiante por su nombre. Pregúntale cómo está antes de cualquier tema académico. Celebra logros específicos, no genéricos.

## FORMATO DE RESPUESTA
Usa markdown: listas con emojis, **negritas** en lo importante, separadores. Respuestas concisas (3-8 líneas). Termina dejando una puerta abierta.

## DETECCIÓN DE RIESGO
Frases como "no puedo", "no sirvo", "para qué", "estoy cansado/a de todo" = señal de alerta. No ignores la señal. Sugiere hablar con un adulto de confianza si es grave.

## REGLAS ABSOLUTAS
- SIEMPRE llamas al estudiante por su nombre.
- NUNCA te identificas como bot, IA o asistente virtual.
- NUNCA respondes con texto plano puro: siempre estructura visual.
- NUNCA eres indiferente ante una emoción.
- SIEMPRE terminas dejando una puerta abierta.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    // Identify the student via the JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    let contextBlock = "Datos del estudiante: no disponibles.";
    if (authHeader) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      const user = userData?.user;
      if (user) {
        const admin = createClient(SUPABASE_URL, SERVICE_KEY);
        const [profileRes, gradesRes, attRes] = await Promise.all([
          admin.from("profiles").select("full_name, grade, institution, apodo_estudiante, nombre_ia, diagnostico_descripcion, diagnostico_necesidad, diagnostico_preocupacion").eq("id", user.id).maybeSingle(),
          admin.from("academic_records").select("subject, grade_value, period").eq("student_id", user.id).order("recorded_at", { ascending: false }).limit(10),
          admin.from("attendance").select("date, status").eq("student_id", user.id).order("date", { ascending: false }).limit(15),
        ]);
        const p = profileRes.data;
        const grades = gradesRes.data ?? [];
        const att = attRes.data ?? [];
        const avg = grades.length
          ? (grades.reduce((s: number, g: any) => s + Number(g.grade_value || 0), 0) / grades.length).toFixed(2)
          : "sin notas";
        const absences = att.filter((a: any) => a.status !== "present").length;

        contextBlock = `Datos actuales del estudiante:
- Nombre completo: ${p?.full_name || user.email?.split("@")[0] || "Estudiante"}
- Apodo preferido: ${p?.apodo_estudiante || "no definido"}
- Tu nombre como mentora: ${p?.nombre_ia || "abi"}
- Grado: ${p?.grade || "no especificado"} | Institución: ${p?.institution || "no especificada"}
- Promedio reciente: ${avg} (${grades.length} notas)
- Inasistencias recientes: ${absences} de ${att.length}
- Diagnóstico inicial - Descripción: ${p?.diagnostico_descripcion || "no respondió"}
- Diagnóstico inicial - Necesidad: ${p?.diagnostico_necesidad || "no respondió"}
- Diagnóstico inicial - Preocupación: ${p?.diagnostico_preocupacion || "no respondió"}

Usa esta información para personalizar tus respuestas. Llama al estudiante por su apodo.`;
      }
    }

    const groqResp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.75,
        max_tokens: 900,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextBlock },
          ...messages,
        ],
      }),
    });

    if (!groqResp.ok) {
      if (groqResp.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await groqResp.text();
      console.error("Groq error:", groqResp.status, t);
      return new Response(JSON.stringify({ error: "Error en Groq" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(groqResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});