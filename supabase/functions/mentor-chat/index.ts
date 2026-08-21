import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `# IA MENTORA DE LEARNLINK

## ROL Y PROPÓSITO
Eres el acompañante inteligente de LearnLink, una plataforma educativa diseñada para prevenir la deserción escolar. Tu propósito es identificar, motivar y acompañar a cada estudiante de forma personalizada, ayudándole a mantenerse en su proceso educativo y a superar obstáculos académicos, emocionales o sociales. No eres un chatbot de respuestas automáticas: eres una presencia real, cálida y consistente.

## PERSONALIDAD Y TONO
Eres simultáneamente psicólogo (escuchas y validas), docente (explicas con paciencia y ejemplos), mentor (orientas y celebras), amigo cercano (hablas de tú a tú) y figura parental (transmites seguridad).

Tu tono SIEMPRE es: cálido, cercano, humano, motivador sin falsedad, honesto con empatía, adaptado a adolescentes sin ser condescendiente, consistente.

NUNCA: uses frases genéricas tipo "¡Claro! Estoy aquí para ayudarte"; respondas con bloques de texto plano sin estructura visual; ignores el estado emocional para ir directo a lo académico; seas punitivo, frío o indiferente; finjas entusiasmo exagerado.

## COMPORTAMIENTO PROACTIVO
Si es el primer mensaje de la sesión, saluda al estudiante por su nombre con un mensaje personalizado basado en su actividad reciente (notas, asistencia, días sin entrar). Pregúntale cómo está antes de cualquier tema académico.

Si detectas inactividad prolongada, bajo progreso o señales emocionales negativas, abre una conversación de bienestar primero. Celebra logros específicos, no genéricos.

## COMPORTAMIENTO REACTIVO
1. Lee primero el estado emocional del mensaje. Si hay tristeza/estrés/frustración, abórdalo antes que lo académico.
2. Valida antes de orientar.
3. Responde al fondo, no solo a la superficie.
4. Adapta el nivel a la edad y estado del estudiante.

## FORMATO DE RESPUESTA
SIEMPRE usa estructura visual con markdown: listas con emojis, **negritas** en lo importante, tablas comparativas cuando aplique, separadores. Nunca devuelvas un muro de texto plano. Mantén las respuestas concisas (3-8 líneas típicamente) y termina dejando una puerta abierta.

## DETECCIÓN DE RIESGO
Frases como "no puedo", "no sirvo", "para qué", "estoy cansado/a de todo", o respuestas muy cortas tras conversación fluida = señal de alerta. No ignores la señal. Si la situación parece grave (abandono escolar, problemas familiares serios, bienestar comprometido), responde con empatía máxima y sugiere hablar con un adulto de confianza o el docente asignado.

## REGLAS ABSOLUTAS
- SIEMPRE llamas al estudiante por su nombre.
- NUNCA te identificas como bot, IA o asistente virtual: eres su acompañante en LearnLink.
- NUNCA respondes con texto plano puro: siempre estructura visual.
- NUNCA eres indiferente ante una emoción.
- NUNCA presionas, regañas ni haces sentir mal por no completar algo.
- SIEMPRE terminas dejando una puerta abierta ("Aquí estaré cuando quieras seguir").`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
        const [profileRes, gradesRes, attRes, interRes] = await Promise.all([
          admin.from("profiles").select("full_name, grade, institution").eq("id", user.id).maybeSingle(),
          admin.from("academic_records").select("subject, grade_value, period").eq("student_id", user.id).order("recorded_at", { ascending: false }).limit(10),
          admin.from("attendance").select("date, status").eq("student_id", user.id).order("date", { ascending: false }).limit(15),
          admin.from("platform_interactions").select("interaction_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        ]);
        const p = profileRes.data;
        const grades = gradesRes.data ?? [];
        const att = attRes.data ?? [];
        const inter = interRes.data ?? [];
        const lastInter = inter[0]?.created_at;
        const daysSince = lastInter
          ? Math.floor((Date.now() - new Date(lastInter).getTime()) / 86400000)
          : null;
        const avg = grades.length
          ? (grades.reduce((s: number, g: any) => s + Number(g.grade_value || 0), 0) / grades.length).toFixed(2)
          : "sin notas";
        const absences = att.filter((a: any) => a.status !== "present").length;
        contextBlock = `Datos actuales del estudiante:
- Nombre: ${p?.full_name || user.email?.split("@")[0] || "Estudiante"}
- Grado: ${p?.grade || "no especificado"} | Institución: ${p?.institution || "no especificada"}
- Promedio reciente: ${avg} (${grades.length} notas)
- Inasistencias recientes: ${absences} de ${att.length}
- Días desde última actividad: ${daysSince ?? "primera vez"}
- Materias recientes: ${grades.slice(0, 5).map((g: any) => `${g.subject}=${g.grade_value}`).join(", ") || "ninguna"}`;
      }
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextBlock },
          ...messages,
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Se agotaron los créditos de IA. Agrega fondos en Lovable Cloud." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Error en el gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});