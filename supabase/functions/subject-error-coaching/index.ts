const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Eres un tutor empático para estudiantes colombianos en riesgo de deserción escolar. Usa lenguaje simple, ejemplos cotidianos y un tono motivador y cercano. NUNCA digas "incorrecto" o "fallaste". NUNCA uses términos técnicos sin explicarlos antes.`;

function sanitize(s: string) {
  let t = s.replace(/```json\s*|\s*```/g, "").trim();
  let out = ""; let inStr = false; let esc = false;
  for (const ch of t) {
    const code = ch.charCodeAt(0);
    if (inStr) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === "\\") { out += ch; esc = true; continue; }
      if (ch === '"') { out += ch; inStr = false; continue; }
      if (code < 0x20) {
        if (ch === "\n") out += "\\n";
        else if (ch === "\r") out += "\\r";
        else if (ch === "\t") out += "\\t";
        else out += " ";
        continue;
      }
      out += ch;
    } else { if (ch === '"') inStr = true; out += ch; }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, pregunta, opcionElegida, respuestaCorrecta, concepto, intento } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const prompt = `Materia: ${subject}
Pregunta: ${pregunta}
Lo que respondió el estudiante: ${opcionElegida}
La respuesta correcta era: ${respuestaCorrecta}
Concepto evaluado: ${concepto || "general"}
Intento número: ${intento || 1} (máximo 3)

Tu tarea: ayudar al estudiante con cariño. Devuelve EXCLUSIVAMENTE un JSON válido:
{
  "explicacion": "string — empieza con '¡Tranquilo/a!' o similar. Explica el concepto en lenguaje muy simple, 2-3 líneas máximo.",
  "ejemplo": "string — un ejemplo de la vida real cotidiana (tienda, casa, comida, deporte) relacionado con el concepto. 1-2 líneas.",
  "nuevaPregunta": {
    "contenido": "string — una pregunta NUEVA, MÁS SENCILLA, sobre el mismo concepto",
    "opciones": ["A", "B", "C", "D", "No estoy seguro/a"],
    "respuesta_correcta": 0,
    "explicacion": "string corta"
  }
}

Reglas: nunca digas "incorrecto" o "fallaste". Usa tono cercano y motivador. La nueva pregunta debe ser MÁS FÁCIL que la original. respuesta_correcta es índice 0-3.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Demasiadas solicitudes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Sin créditos." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error("AI error " + r.status);

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(sanitize(raw)); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(sanitize(m[0])) : {};
    }
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});