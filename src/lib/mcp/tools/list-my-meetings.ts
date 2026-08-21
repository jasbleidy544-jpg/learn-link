import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_meetings",
  title: "List my mentoring sessions",
  description:
    "List mentoring sessions (meetings) for the signed-in user, either as student or as host teacher.",
  inputSchema: {
    status: z.enum(["scheduled", "completed", "cancelled"]).optional()
      .describe("Optional status filter."),
    limit: z.number().int().optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    let query = supabase
      .from("meetings")
      .select("id, title, description, scheduled_at, duration_minutes, meet_link, status, host_id, student_id")
      .or(`student_id.eq.${userId},host_id.eq.${userId}`)
      .order("scheduled_at", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { meetings: data ?? [] },
    };
  },
});