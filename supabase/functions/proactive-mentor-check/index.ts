import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function generateMessage(prompt: string): Promise<string> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.85,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "Eres una mentora cálida y empática que motiva a estudiantes adolescentes en español. Responde en 2-3 frases breves, cercanas y motivadoras. Usa emojis con moderación.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || "¡Hola! Estoy aquí para ti ✨";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "student");

    const studentIds = (roles || []).map((r) => r.user_id);
    let created = 0;

    for (const sid of studentIds) {
      const { data: recent } = await supabase
        .from("ai_recommendations")
        .select("id")
        .eq("student_id", sid)
        .eq("type", "proactive")
        .gte("generated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      if (recent && recent.length > 0) continue;

      const { data: interactions } = await supabase
        .from("platform_interactions")
        .select("created_at")
        .eq("user_id", sid)
        .gte("created_at", since)
        .limit(1);

      const { data: profile } = await supabase
        .from("profiles")
        .select("apodo_estudiante, full_name")
        .eq("id", sid)
        .maybeSingle();

      const nick =
        profile?.apodo_estudiante ||
        profile?.full_name?.split(" ")[0] ||
        "amigo";

      let prompt: string | null = null;
      let title = "Mensaje de tu mentora";
      let priority = "medium";

      if (!interactions || interactions.length === 0) {
        prompt = `El estudiante ${nick} no ha entrado a la plataforma en 3 días. Escríbele un mensaje breve para motivarlo a volver, sin culpa, recordándole que estás para acompañarlo.`;
        title = "Te extrañamos";
        priority = "high";
      } else {
        const { data: quizzes } = await supabase
          .from("student_activities")
          .select("score, area")
          .eq("student_id", sid)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(3);

        if (quizzes && quizzes.length > 0) {
          const avg = quizzes.reduce((s, q) => s + (q.score || 0), 0) / quizzes.length;
          if (avg < 50) {
            prompt = `El estudiante ${nick} ha tenido bajo desempeño en sus últimos retos (promedio ${Math.round(avg)}%). Anímalo con un mensaje cálido, recordándole que aprender lleva tiempo y que lo estás acompañando.`;
            title = "Sigamos avanzando";
          } else if (avg >= 80) {
            prompt = `El estudiante ${nick} va excelente en sus retos (promedio ${Math.round(avg)}%). Felicítalo y motívalo a seguir.`;
            title = "¡Vas increíble!";
          }
        }
      }

      if (!prompt) continue;

      const content = await generateMessage(prompt);
      await supabase.from("ai_recommendations").insert({
        student_id: sid,
        type: "proactive",
        title,
        content,
        priority,
      });
      created++;
    }

    return new Response(JSON.stringify({ ok: true, created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});