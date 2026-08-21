import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_notifications",
  title: "List my notifications",
  description: "List notifications for the signed-in student.",
  inputSchema: {
    only_unread: z.boolean().optional().describe("Return only unread notifications."),
    limit: z.number().int().optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_unread, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("student_notifications")
      .select("id, title, message, body, type, link, is_read, created_at")
      .eq("student_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (only_unread) query = query.eq("is_read", false);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { notifications: data ?? [] },
    };
  },
});