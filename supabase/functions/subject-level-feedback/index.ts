const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, levelName, nextLevelName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const prompt = `Acabo de desbloquear el nivel "${levelName}" en la materia "${subject}". ${
      nextLevelName ? `El siguiente nivel es "${nextLevelName}".` : "¡Era el último nivel!"
    } Escribe un mensaje motivacional muy personal, cálido, cercano y breve (2-3 frases máximo) en español, en segunda persona, conectando lo que aprendí con su vida diaria o su futuro. No uses comillas ni markdown.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
        { role: "system", content: "Eres un tutor empático para estudiantes colombianos en riesgo de deserción escolar. Celebras sus logros con cercanía, ejemplos cotidianos y sin tecnicismos." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!r.ok) throw new Error("AI error " + r.status);
    const data = await r.json();
    const mensaje = data?.choices?.[0]?.message?.content?.trim() ||
      "¡Excelente trabajo! Sigue así, vas por buen camino.";
    return new Response(JSON.stringify({ mensaje }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({
      mensaje: "¡Excelente trabajo! Sigue así, vas por buen camino.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});