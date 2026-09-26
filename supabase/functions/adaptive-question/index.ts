const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const area: string = body.area ?? "matemáticas";
    const level: string = body.level ?? "medio";
    const tema: string = (body.tema ?? "").toString().trim();
    const requested = body.count;
    const auto = requested === "auto" || requested == null;
    const count: number = auto
      ? 0
      : Math.min(10, Math.max(3, Number(requested) || 5));
    const avoid: string[] = Array.isArray(body.avoid) ? body.avoid.slice(0, 40) : [];
    const seed = Math.random().toString(36).slice(2, 8);

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");

    const sys = `Eres una IA mentora educativa experta en pruebas tipo ICFES (Colombia).
Genera un cuestionario adaptativo en español para el área "${area}"${tema ? ` sobre el tema específico "${tema}"` : ""} con dificultad "${level}".
Cada pregunta debe tener: enunciado claro, 4 opciones (a, b, c, d), una opción correcta y una explicación breve y visual.
Reglas de dificultad:
- "fácil" / "básico": situaciones cotidianas muy simples y conceptos directos.
- "medio" / "intermedio": aplicación simple de conceptos.
- "difícil" / "avanzado": análisis y resolución de problemas complejos.
El lenguaje debe ser apropiado para estudiantes colombianos de secundaria.
Reglas:
- ${auto ? "Tú decides cuántas preguntas generar entre 5 y 10 según la dificultad y profundidad del tema." : `Genera exactamente ${count} preguntas.`}
- Varía estilos: opción múltiple, completar, interpretación, aplicación.
- Nunca repitas literalmente preguntas. Evita las siguientes (resúmenes de anteriores): ${avoid.length ? avoid.map((s) => `"${s.slice(0, 80)}"`).join("; ") : "ninguna"}.
- Identificador de sesión: ${seed} (úsalo para garantizar variedad).
Para matemáticas/física/química: problemas concretos. Para ciencias/biología: conceptos o aplicación. Para lenguaje/castellano/inglés: comprensión lectora corta. Para filosofía/religión/arte/sociales: análisis e interpretación.

Devuelve EXCLUSIVAMENTE un JSON con la forma: { "title": string, "questions": [{ "question": string, "options": [string, string, string, string], "correct_index": number, "explanation": string }] }`;

    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.85,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: auto
              ? `Genera entre 5 y 10 preguntas tipo ICFES de ${area} (${level}). Tú eliges la cantidad ideal.`
              : `Genera ${count} preguntas tipo ICFES de ${area} (${level}).` },
        ],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const j = await r.json();
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    let quiz: { title: string; questions: any[] } = { title: `Reto de ${area}`, questions: [] };
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") quiz = parsed;
    } catch (_) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) try { quiz = JSON.parse(m[0]); } catch (_) { /* ignore */ }
    }
    return new Response(JSON.stringify({ ...quiz, area, level }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});