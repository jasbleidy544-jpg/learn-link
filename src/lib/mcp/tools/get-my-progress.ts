import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_progress",
  title: "Get my learning progress",
  description:
    "Get the signed-in student's gamification level/XP and per-subject learning journeys.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [gam, journeys] = await Promise.all([
      supabase
        .from("student_gamification")
        .select("level, xp, badges_earned, updated_at")
        .eq("student_id", userId)
        .maybeSingle(),
      supabase
        .from("subject_journeys")
        .select("subject, nivel, current_level, temas_fuertes, temas_a_reforzar, updated_at")
        .eq("user_id", userId),
    ]);
    const error = gam.error ?? journeys.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const result = { gamification: gam.data, subjects: journeys.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});