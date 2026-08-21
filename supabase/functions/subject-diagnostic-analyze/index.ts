import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Eres un tutor empático para estudiantes colombianos en riesgo de deserción escolar. Diseñas caminos de aprendizaje muy graduales, con lenguaje simple y ejemplos cotidianos. NUNCA asumes que el estudiante domina los temas de su grado.`;

function buildPrompt(subject: string, grade: string, cuestionario: any, ejercicios: any[]) {
  return `Materia: ${subject}
Grado: ${grade || "no especificado"}

Cuestionario del estudiante:
${JSON.stringify(cuestionario, null, 2)}

Resultados de ejercicios prácticos (cada item incluye enunciado, respuesta del estudiante y respuesta correcta):
${JSON.stringify(ejercicios, null, 2)}

Analiza y devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin texto extra) con esta forma exacta:
{
  "nivel": "Básico" | "Intermedio" | "Avanzado",
  "temas_fuertes": [string, ...],
  "temas_a_reforzar": [string, ...],
  "perfil": string,
  "mensaje_motivacional": string,
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
- Empieza desde lo MUY básico (vida cotidiana), sube dificultad de forma MUY gradual entre niveles. Nunca saltes de golpe.
- Usa situaciones reales: dinero, comida, deporte, casa, redes sociales, viajes.
- NO uses derivadas, ecuaciones complejas ni jerga académica.
- Cada pregunta: 5 opciones (4 reales + "No estoy seguro/a" como última). respuesta_correcta es índice 0-3.
- "concepto": etiqueta corta (2-3 palabras) del tema evaluado.
- "explicacion": clara, con ejemplo cotidiano.
- temas_fuertes y temas_a_reforzar: 2 a 5 elementos.
- perfil: 2 frases personalizadas y motivadoras.
- mensaje_motivacional: cálido, cercano, en segunda persona, máximo 2 frases.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, grade, cuestionario, ejercicios } = await req.json();
    if (!subject) throw new Error("subject requerido");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

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

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt(subject, grade, cuestionario, ejercicios || []) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Sin créditos disponibles." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    await admin.from("subject_diagnostics").insert({
      user_id: user.id, subject, cuestionario, ejercicios,
    });

    const payload = {
      user_id: user.id,
      subject,
      nivel: result.nivel || "Básico",
      temas_fuertes: result.temas_fuertes || [],
      temas_a_reforzar: result.temas_a_reforzar || [],
      perfil: result.perfil || "",
      mensaje_motivacional: result.mensaje_motivacional || "",
      camino: result.camino || [],
      current_level: 1,
    };

    const { data: journey, error: jErr } = await admin
      .from("subject_journeys")
      .upsert(payload, { onConflict: "user_id,subject" })
      .select()
      .maybeSingle();
    if (jErr) throw jErr;

    return new Response(JSON.stringify({ ok: true, journey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});