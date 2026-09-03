import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchClasses from "./tools/search_classes";
import getClass from "./tools/get_class";
import listSchools from "./tools/list_schools";
import listSavedClasses from "./tools/list_saved_classes";
import saveClass from "./tools/save_class";
import listMyLeads from "./tools/list_my_leads";
import createLead from "./tools/create_lead";

// Use the direct Supabase issuer (never the .lovable.cloud proxy) — VITE_SUPABASE_PROJECT_ID
// is inlined at build time by Vite. Fallback keeps the issuer well-formed for
// manifest-extract eval; the published build has the real ref.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "activoo-mcp",
  title: "activoo",
  version: "0.1.0",
  instructions:
    "Tools for activoo — a marketplace of kids' classes, activities, masterclasses, and services. Use search_classes to discover offerings, get_class for details, list_schools to browse providers, and save_class / create_lead / list_my_leads / list_saved_classes to act on behalf of the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchClasses, getClass, listSchools, listSavedClasses, saveClass, listMyLeads, createLead],
});
