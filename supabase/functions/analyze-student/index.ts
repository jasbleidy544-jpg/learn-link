import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentId = user.id;

    const [academicRes, attendanceRes, interactionsRes, profileRes] = await Promise.all([
      supabaseAdmin.from("academic_records").select("*").eq("student_id", studentId).order("recorded_at", { ascending: false }).limit(20),
      supabaseAdmin.from("attendance").select("*").eq("student_id", studentId).order("date", { ascending: false }).limit(30),
      supabaseAdmin.from("platform_interactions").select("*").eq("user_id", studentId).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("profiles").select("*").eq("id", studentId).single(),
    ]);

    const academicRecords = academicRes.data || [];
    const attendanceRecords = attendanceRes.data || [];
    const interactions = interactionsRes.data || [];
    const profile = profileRes.data;

    const avgGrade = academicRecords.length > 0
      ? academicRecords.reduce((sum: number, r: any) => sum + Number(r.grade_value), 0) / academicRecords.length
      : 0;

    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a: any) => a.status === "present").length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

    const interactionCount = interactions.length;
    const recentInteractions = interactions.filter((i: any) => {
      const daysDiff = (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    const prompt = `Eres un consejero académico y emocional experto en educación. Analiza los siguientes datos de un estudiante y genera recomendaciones personalizadas en español.

DATOS DEL ESTUDIANTE:
- Nombre: ${profile?.full_name || "Estudiante"}
- Grado: ${profile?.grade || "No especificado"}
- Institución: ${profile?.institution || "No especificada"}
- Promedio académico: ${avgGrade.toFixed(1)}/5.0
- Tasa de asistencia: ${attendanceRate.toFixed(1)}%
- Materias registradas: ${[...new Set(academicRecords.map((r: any) => r.subject))].join(", ") || "Ninguna"}
- Notas bajas en: ${academicRecords.filter((r: any) => Number(r.grade_value) < 3.0).map((r: any) => r.subject).join(", ") || "Ninguna"}
- Interacciones en la plataforma (últimos 7 días): ${recentInteractions}
- Total interacciones: ${interactionCount}

Genera EXACTAMENTE 4 recomendaciones. Los tipos deben ser: una "academic", una "motivational", una "improvement" y una "risk_alert".
Para risk_alert, evalúa el riesgo de deserción considerando: promedio < 3.0, asistencia < 70%, baja interacción.
La prioridad debe ser: "low", "medium", "high" o "critical" según la urgencia.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin texto extra) con esta forma:
{
  "recommendations": [
    { "type": "academic" | "motivational" | "improvement" | "risk_alert", "title": string, "content": string, "priority": "low" | "medium" | "high" | "critical" }
  ]
}`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Eres un consejero académico y emocional especializado en prevención de deserción escolar en Latinoamérica. Responde siempre en JSON válido." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      if (statusCode === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", statusCode, errText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const raw = aiResult.choices?.[0]?.message?.content ?? "{}";
    let recommendations: any[] = [];
    try {
      const parsed = JSON.parse(raw);
      recommendations = parsed.recommendations || [];
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { recommendations = JSON.parse(m[0]).recommendations || []; } catch { /* ignore */ }
      }
    }

    if (recommendations.length > 0) {
      await supabaseAdmin
        .from("ai_recommendations")
        .delete()
        .eq("student_id", studentId)
        .eq("is_read", false);

      const toInsert = recommendations.map((r: any) => ({
        student_id: studentId,
        type: r.type,
        title: r.title,
        content: r.content,
        priority: r.priority,
      }));

      await supabaseAdmin.from("ai_recommendations").insert(toInsert);
    }

    await supabaseAdmin.from("platform_interactions").insert({
      user_id: studentId,
      interaction_type: "ai_analysis",
      metadata: { recommendations_count: recommendations.length },
    });

    return new Response(
      JSON.stringify({
        recommendations,
        metrics: {
          avgGrade: avgGrade.toFixed(1),
          attendanceRate: attendanceRate.toFixed(1),
          recentInteractions,
          totalInteractions: interactionCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-student error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});