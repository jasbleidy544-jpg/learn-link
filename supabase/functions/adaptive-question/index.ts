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
    const grade: string = (body.grade ?? "").toString().trim();
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

    // Mapear el nivel a un rango de dificultad
    const dificultadDescriptiva =
      level === "fácil" || level === "básico" ? "fácil"
        : level === "difícil" || level === "avanzado" ? "difícil"
        : "media";

    const gradeHint = grade
      ? `El estudiante está en grado "${grade}" de secundaria colombiana.`
      : "El estudiante está en secundaria colombiana (no se especificó el grado).";

    const sys = `Eres una IA mentora educativa experta en pruebas ICFES de Colombia.

TAREA: Generar preguntas TIPO ICFES en español para la materia "${area}"${tema ? ` sobre el tema "${tema}"` : ""}.

CONTEXTO DEL ESTUDIANTE:
- ${gradeHint}
- Dificultad objetivo: ${dificultadDescriptiva}.

REGLAS CRÍTICAS:

1. **SIEMPRE usa contexto narrativo**. Cada pregunta debe presentar una situación con personajes, lugares o situaciones reales.
   ❌ MAL: "¿Cuánto es 3 + 3?"
   ✅ BIEN: "Pedro tiene 3 manzanas y su mamá le regala otras 3. ¿Cuántas manzanas tiene Pedro ahora?"

2. **Adapta el tipo de pregunta según la materia**:
   - **Matemáticas, física, química**: problemas con datos numéricos y contexto cotidiano (compras, viajes, cocina, deportes, dinero).
   - **Biología, ciencias naturales**: situaciones de la vida real sobre salud, ambiente, cuerpo humano, ecosistemas.
   - **Lenguaje, castellano**: fragmentos de texto cortos (cuentos, noticias, poemas) con preguntas de comprensión, interpretación o gramática.
   - **Inglés**: pequeños textos en inglés con preguntas de reading, vocabulary o grammar.
   - **Sociales, historia**: contextos históricos o geográficos con preguntas de análisis.
   - **Filosofía, religión, arte**: situaciones de reflexión con preguntas de interpretación.

3. **Dificultad "fácil"**: datos simples, un solo paso de razonamiento, números pequeños.
   **Dificultad "media"**: aplicación de conceptos, dos pasos, distractores plausibles.
   **Dificultad "difícil"**: análisis, múltiples pasos, requiere razonamiento.

4. **Opciones**: 4 opciones (a, b, c, d) con distractores plausibles. La opción correcta NO siempre es la misma letra.

5. **Explicación**: breve (1-2 frases), con ejemplo cotidiano cuando aplique.

6. **Cantidad**: ${auto ? "Tú decides entre 5 y 10 preguntas según la profundidad del tema." : `Genera exactamente ${count} preguntas.`}

7. **Variedad**: nunca repitas preguntas. Evita estas (resúmenes de anteriores): ${avoid.length ? avoid.map((s) => `"${s.slice(0, 80)}"`).join("; ") : "ninguna"}.
   - Identificador de sesión: ${seed} (úsalo para garantizar variedad).

8. **Si el estudiante está en grado bajo (6°-8°)**: usa lenguaje más simple y situaciones muy cotidianas.
   **Si está en grado alto (9°-11°)**: mayor profundidad y análisis.

Devuelve EXCLUSIVAMENTE un JSON con esta forma exacta:
{
  "title": string,
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correct_index": number,
      "explanation": string
    }
  ]
}`;

    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.85,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: auto
              ? `Genera entre 5 y 10 preguntas tipo ICFES contextualizadas de ${area} (${dificultadDescriptiva}) para grado ${grade || "no especificado"}.`
              : `Genera ${count} preguntas tipo ICFES contextualizadas de ${area} (${dificultadDescriptiva}) para grado ${grade || "no especificado"}.` },
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
    return new Response(JSON.stringify({ ...quiz, area, level, grade }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});