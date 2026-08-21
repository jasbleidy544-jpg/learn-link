import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Falta el parámetro authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await (supabase.auth as any).oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauth = (supabase.auth as any).oauth;
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("El servidor de autorización no devolvió una URL de redirección.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen night-sky flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/70 backdrop-blur-md p-6 space-y-4">
        {error ? (
          <>
            <h1 className="text-xl font-bold">No se pudo cargar la solicitud</h1>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
          </>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <>
            <h1 className="text-xl font-bold">
              Conectar {details.client?.name ?? "una aplicación"} a tu cuenta
            </h1>
            <p className="text-sm text-muted-foreground">
              {details.client?.name ?? "La aplicación"} podrá usar LearnLink en tu nombre y acceder a
              los datos que tú puedes ver.
            </p>
            <div className="flex gap-3 pt-2">
              <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                Aprobar
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => decide(false)}
                className="flex-1"
              >
                Rechazar
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}