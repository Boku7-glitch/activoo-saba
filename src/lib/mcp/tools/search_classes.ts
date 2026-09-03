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
  name: "search_classes",
  title: "Search classes",
  description:
    "Search visible classes on activoo. Filter by free-text query (matches title/description), district, minimum/maximum age, and maximum price. Returns up to 20 classes with school info.",
  inputSchema: {
    query: z.string().trim().max(200).optional().describe("Free-text search across title and description."),
    district: z.string().trim().max(100).optional().describe("Filter by school district."),
    age: z.number().int().min(0).max(99).optional().describe("Child age; returns classes whose age range includes this age."),
    max_price: z.number().min(0).optional().describe("Maximum price_from in GEL."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, district, age, max_price, limit }, ctx) => {
    const sb = userClient(ctx);
    let q = sb
      .from("classes")
      .select("id,title,description,price_from,age_min,age_max,category,formats,image_url,school:schools(id,name,district,address,lat,lng)")
      .eq("is_visible", true)
      .is("deleted_at", null)
      .limit(limit ?? 20);
    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (age !== undefined) q = q.lte("age_min", age).gte("age_max", age);
    if (max_price !== undefined) q = q.lte("price_from", max_price);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    let rows = data ?? [];
    if (district) {
      const d = district.toLowerCase();
      rows = rows.filter((r: any) => r.school?.district?.toLowerCase().includes(d));
    }
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { classes: rows },
    };
  },
});
