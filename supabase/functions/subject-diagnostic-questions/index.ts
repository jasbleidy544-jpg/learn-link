import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subject, grade, topics } = await req.json();
    if (!subject) throw new Error("subject requerido");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const topicsHint = Array.isArray(topics) && topics.length
      ? `Enfócate ESPECÍFICAMENTE en estos temas que el estudiante necesita reforzar: ${topics.join(", ")}.`
      : "";
    const prompt = `Genera EXACTAMENTE 5 preguntas MUY FÁCILES de la materia "${subject}" para un estudiante colombiano de grado "${grade || 'no especificado'}" que tiene vacíos grandes en la materia. ${topicsHint}

REGLAS CRÍTICAS:
- NO asumas que domina los temas de su grado. Empieza SIEMPRE desde conceptos básicos y cotidianos.
- Usa situaciones de la vida real (tienda, cocina, casa, deporte, redes sociales, dinero).
- Lenguaje sencillo, cercano, sin tecnicismos.
- Distractores plausibles pero distinguibles con sentido común.
- La 5ª opción de TODAS las preguntas debe ser exactamente "No estoy seguro/a".
- NUNCA uses derivadas, ecuaciones complejas, fórmulas o vocabulario académico avanzado.

Ejemplos del nivel correcto:
- Matemáticas: "Si tienes $5.000 y gastas $2.000 en una gaseosa, ¿cuánto te queda?"
- Física: "¿Por qué crees que una pelota rueda más rápido cuesta abajo que cuesta arriba?"
- Castellano: "Lee esta frase corta y dime con tus palabras qué está pasando."

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown):
{
  "preguntas": [
    { "enunciado": string, "opciones": [string, string, string, string, "No estoy seguro/a"], "respuesta_correcta": 0, "explicacion": string, "concepto": string }
  ]
}
- respuesta_correcta es el índice 0-3 (nunca 4, la opción "No estoy seguro/a" nunca es correcta).
- "concepto" es una etiqueta corta (2-3 palabras) del tema evaluado.
- En español, todo.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un experto en evaluación educativa colombiana." },
          { role: "user", content: prompt },
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
    // Sanitize: strip code fences and escape unescaped control characters inside strings
    const sanitize = (s: string) => {
      let t = s.replace(/```json\s*|\s*```/g, "").trim();
      // Replace raw control chars (newlines/tabs/etc) with escaped versions
      let out = "";
      let inStr = false;
      let esc = false;
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
        } else {
          if (ch === '"') inStr = true;
          out += ch;
        }
      }
      return out;
    };
    let parsed: any;
    try { parsed = JSON.parse(sanitize(raw)); }
    catch (err) {
      console.error("JSON parse failed", err, raw.slice(0, 200));
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(sanitize(m[0])) : { preguntas: [] };
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