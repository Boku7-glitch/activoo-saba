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
  name: "create_lead",
  title: "Submit a booking request",
  description:
    "Submit a booking request (lead) for a class. Parent contact info is required so the school can follow up. The lead is attached to the signed-in user.",
  inputSchema: {
    class_id: z.string().uuid(),
    parent_name: z.string().trim().min(1).max(100),
    parent_phone: z.string().trim().min(4).max(30),
    child_age: z.number().int().min(0).max(99).optional(),
    message: z.string().trim().max(1000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ class_id, parent_name, parent_phone, child_age, message }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = userClient(ctx);
    const { data: cls, error: clsErr } = await sb
      .from("classes")
      .select("id, school_id")
      .eq("id", class_id)
      .maybeSingle();
    if (clsErr) return { content: [{ type: "text", text: clsErr.message }], isError: true };
    if (!cls) return { content: [{ type: "text", text: "Class not found" }], isError: true };

    const { data, error } = await sb
      .from("leads")
      .insert({
        class_id,
        school_id: cls.school_id,
        parent_user_id: ctx.getUserId(),
        parent_name,
        parent_phone,
        child_age: child_age ?? null,
        message: message ?? null,
      })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Booking request submitted (${data?.id}).` }],
      structuredContent: { lead: data },
    };
  },
});
