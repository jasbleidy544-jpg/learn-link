const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, levelName, nextLevelName } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY no configurada");

    const prompt = `Acabo de desbloquear el nivel "${levelName}" en la materia "${subject}". ${
      nextLevelName ? `El siguiente nivel es "${nextLevelName}".` : "¡Era el último nivel!"
    } Escribe un mensaje motivacional muy personal, cálido, cercano y breve (2-3 frases máximo) en español, en segunda persona, conectando lo que aprendí con su vida diaria o su futuro. No uses comillas ni markdown.`;

    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.85,
        max_tokens: 250,
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