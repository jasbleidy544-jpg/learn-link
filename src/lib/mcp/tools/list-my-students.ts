import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_students",
  title: "List my assigned students",
  description:
    "List students assigned to the signed-in teacher (active or retired volunteer), with risk level when available.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: assignments, error } = await supabase
      .from("asignaciones")
      .select("id, estudiante_id, institution_id, creado_en")
      .eq("docente_id", ctx.getUserId());
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const ids = (assignments ?? []).map((a) => a.estudiante_id).filter(Boolean);
    let students: unknown[] = [];
    if (ids.length > 0) {
      const { data, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, grade, grado, institution")
        .in("id", ids);
      if (profErr) return { content: [{ type: "text", text: profErr.message }], isError: true };
      students = data ?? [];
    }
    const result = { assignments: assignments ?? [], students };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});