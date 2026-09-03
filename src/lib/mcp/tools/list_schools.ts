import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function userClient(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_schools",
  title: "List schools",
  description: "List schools on activoo, optionally filtered by district.",
  inputSchema: {
    district: z.string().trim().max(100).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ district, limit }, ctx) => {
    const sb = userClient(ctx);
    let q = sb
      .from("schools")
      .select("id,name,district,address,phone,email,website,rating,lat,lng,image_url")
      .is("deleted_at", null)
      .limit(limit ?? 50);
    if (district) q = q.ilike("district", `%${district}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { schools: data ?? [] },
    };
  },
});
