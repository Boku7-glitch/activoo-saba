import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthAuthorizationDetails = {
  client?: { name?: string; client_uri?: string; redirect_uris?: string[] } | null;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthAuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthAuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthAuthorizationDetails | null; error: { message: string } | null }>;
};
function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-6 text-sm">
      <p className="font-semibold text-destructive">Could not load this authorization request</p>
      <p className="mt-2 text-foreground/70">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";
  const scopes = details?.scopes ?? [];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 shadow-soft">
        <div className="mb-5 flex justify-center"><Logo height={22} /></div>
        <h1 className="text-xl font-extrabold">Connect {clientName} to activoo</h1>
        <p className="mt-2 text-sm text-foreground/70">
          This lets <b>{clientName}</b> use activoo as you — search classes, view details, save favorites, and submit booking requests on your behalf.
        </p>
        {scopes.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-foreground/70">
            {scopes.map((s: string) => <li key={s}>• {s}</li>)}
          </ul>
        )}
        <p className="mt-4 text-xs text-foreground/60">
          Access is limited by activoo's permissions — {clientName} cannot see or change other users' data.
        </p>
        {error && <p role="alert" className="mt-4 text-xs text-destructive">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 h-11 rounded-2xl border border-border text-sm font-bold text-foreground/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 h-11 rounded-2xl bg-foreground text-sm font-bold text-background shadow-pop disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Approve"}
          </button>
        </div>
      </div>
    </main>
  );
}
