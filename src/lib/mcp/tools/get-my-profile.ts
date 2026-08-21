import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my profile",
  description: "Get the signed-in LearnLink user's profile, role and institution.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [{ data: profile, error }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, grade, grado, institution, teacher_type, subjects, diagnostico_completado")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const result = { profile, roles: (roles ?? []).map((r) => r.role) };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});