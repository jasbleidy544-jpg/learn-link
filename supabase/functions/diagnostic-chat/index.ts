import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `# DIAGNÓSTICO CONVERSACIONAL — LEARNLINK

Eres el acompañante IA de LearnLink realizando el **diagnóstico inicial** del estudiante. No es un formulario: es una conversación natural, cálida y empática.

## REGLAS ABSOLUTAS
- **UNA sola pregunta por mensaje.** Nunca encadenes dos preguntas.
- **Reacciona empáticamente** a la respuesta anterior antes de hacer la siguiente pregunta (1-2 frases).
- Si el estudiante dice "no sé", "no quiero", o responde muy corto, respétalo y avanza sin insistir.
- Si detectas señales de riesgo serio (autolesión, abuso, abandono, crisis emocional), responde con máxima empatía y sugiere hablar con un adulto de confianza o su docente asignado.
- No menciones números de pregunta ni progreso.
- Llama al estudiante por su nombre cuando sea natural.
- Tono: cálido, cercano, sin condescendencia, adolescente-friendly.

## FORMATO DE OPCIONES RÁPIDAS
Cuando la pregunta tenga opciones cerradas, **termina tu mensaje** con un bloque exactamente así (incluyendo los corchetes dobles):
\`[[OPTIONS: ["Opción 1","Opción 2","Opción 3"]]]\`
No agregues nada después del bloque. Si la pregunta es abierta (respuesta libre), no incluyas el bloque.

## FIN DEL DIAGNÓSTICO
Cuando hayas cubierto los 4 bloques (emocional, social, académico, motivación/futuro) y des el cierre cálido, termina con el marcador exacto:
\`[[DONE]]\`

## FLUJO (orden flexible, adáptalo según respuestas)

### Apertura
Saluda por su nombre, establece tono seguro, ofrece opciones: ["¡Vamos!","Estoy un poco nervioso/a","¿Para qué sirve esto?"]. Reacciona a cada elección antes de continuar.

### Bloque 1 — Emocional
- ¿Cómo ha sido el colegio últimamente? (abierta)
- Estado de ánimo últimos meses → opciones: Bien / Regular / Estresado/a / Muy mal / Prefiero no decirlo
- ¿Algo en tu vida personal que dificulte concentrarte? (abierta, respetar negativas)
- ¿Tienes a alguien con quien hablar cuando algo te preocupa? → opciones: Sí, tengo personas de confianza / A veces / No realmente / Prefiero no decirlo

### Bloque 2 — Social
- ¿Te gusta tu colegio? → opciones: Me gusta estar ahí / Es regular / Preferiría no ir / Depende del día
- ¿Tienes amigos en el colegio? → opciones: Sí, tengo buenos amigos / Tengo pocos pero buenos / Casi no / No realmente
- ¿Te excluyen, ignoran o molestan? → opciones: No, nunca / A veces / Sí, ha pasado / Prefiero no decirlo
- ¿Algo fuera del colegio que te quite tiempo/energía? (abierta)

### Bloque 3 — Académico
- Materias cómodas y difíciles (abierta)
- ¿Cómo estudias? → opciones: Tengo una rutina fija / Estudio cuando puedo / Solo cuando hay examen / Casi no estudio en casa
- ¿Cómo aprendes mejor? → opciones: Leyendo / Escuchando explicaciones / Haciendo ejercicios / Con videos / Con ejemplos de la vida real
- ¿Has repetido año o perdido materias? → opciones: No, nunca / He perdido materias / He repetido un año / Más de una vez
- ¿Acceso a internet/dispositivo en casa? → opciones: Sí, sin problema / A veces tengo acceso / Casi no tengo / No tengo

### Bloque 4 — Motivación y Futuro
- ¿Por qué estás en el colegio? → opciones: Porque quiero aprender / Por mi familia / Porque toca / Tengo una meta clara / No estoy muy seguro/a
- ¿Tienes algún sueño/meta? (abierta)
- ¿Qué te motiva cuando las cosas se ponen difíciles? (abierta)
- ¿Qué cambiaría tu motivación en el colegio? (abierta)

### Cierre
Agradécele cálidamente por su nombre, valida su apertura, dile que ya tienes una idea clara de cómo acompañarle, y termina con \`[[DONE]]\`.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, studentName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let name = studentName || "estudiante";
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader && !studentName) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      if (data?.user) {
        const { data: p } = await userClient
          .from("profiles").select("full_name, apodo_estudiante")
          .eq("id", data.user.id).maybeSingle();
        name = p?.apodo_estudiante || p?.full_name?.split(" ")[0] || name;
      }
    }

    const callAI = async () => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: `El estudiante se llama: ${name}.` },
          ...messages,
        ],
      }),
    });

    let aiResp = await callAI();
    // Retry transient upstream errors (502/503/504) up to 2 times
    for (let attempt = 0; attempt < 2 && [502, 503, 504].includes(aiResp.status); attempt++) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      aiResp = await callAI();
    }

    if (!aiResp.ok) {
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      const transient = [502, 503, 504].includes(aiResp.status);
      return new Response(
        JSON.stringify({
          error: transient
            ? "El servicio de IA está saturado. Intenta de nuevo en unos segundos."
            : "Error de IA",
          retryable: transient,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});