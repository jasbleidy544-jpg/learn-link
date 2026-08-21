import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_activities",
  title: "List my activities",
  description:
    "List the signed-in student's assigned activities with their completion status and score.",
  inputSchema: {
    only_pending: z.boolean().optional().describe("Return only activities not yet completed."),
    limit: z.number().int().optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_pending, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("actividades_estudiantes")
      .select(
        "id, completada, puntaje, fecha_realizacion, actividad_id, actividades(titulo, materia, tema, dificultad, num_preguntas, docente_nombre)"
      )
      .eq("estudiante_id", ctx.getUserId())
      .order("enviada_en", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (only_pending) query = query.eq("completada", false);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { activities: data ?? [] },
    };
  },
});