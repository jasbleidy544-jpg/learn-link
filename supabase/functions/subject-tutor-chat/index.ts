const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Eres un tutor empático para estudiantes colombianos en riesgo de deserción escolar. Usa lenguaje apropiado para adolescentes (cercano pero no informal en exceso). Nunca uses términos técnicos sin explicarlos antes.

ESTRUCTURA OBLIGATORIA en cada respuesta:
1. Explicación simple en 2-3 líneas.
2. Un ejemplo cotidiano relacionado (tienda, cocina, deporte, redes, casa, dinero).
3. Una analogía simple si aplica.
4. Pasos numerados si es un procedimiento.

REGLAS:
- Máximo 150 palabras por respuesta.
- Si detectas frustración ("no entiendo nada", "me rindo", "es muy difícil"), responde primero con empatía antes de explicar.
- Si el estudiante dice "no entiendo", reformula con OTRO enfoque distinto al anterior.
- Nunca digas "incorrecto" o "fallaste". Siempre tono motivador.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");
    if (!Array.isArray(messages)) throw new Error("messages requerido");

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `${SYSTEM}\n\nMateria actual del estudiante: ${subject || "general"}.` },
          ...messages,
        ],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Sin créditos disponibles." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error("AI error " + r.status);

    const data = await r.json();
    const respuesta = data?.choices?.[0]?.message?.content?.trim() || "Cuéntame más, ¿qué parte te genera dudas?";
    return new Response(JSON.stringify({ respuesta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});