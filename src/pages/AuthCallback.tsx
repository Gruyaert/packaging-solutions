import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";
import { useSession } from "@/components/auth/SessionContext";

export default function AuthCallback() {
  const [error, setError] = useState("");
  const navigate = useNavigate(), { recovery } = useSession();
  useEffect(() => {
    let mounted = true;
    // getSession awaits the client's PKCE/code or hash processing; do not exchange the code twice.
    supabase.auth.getSession().then(({ data, error: failure }) => {
      if (!mounted) return;
      if (failure) setError(authErrorMessage(failure));
      else if (data.session) navigate(recovery ? "/reset-password" : "/", { replace: true });
      else setError("De aanmeldlink is ongeldig of verlopen. Vraag een nieuwe link aan.");
    }).catch(failure => { if (mounted) setError(authErrorMessage(failure)); });
    return () => { mounted = false; };
  }, [navigate, recovery]);
  return <main className="mx-auto max-w-md space-y-4 p-8"><h1 className="text-xl font-semibold">Aanmelding bevestigen</h1>{error ? <><p role="alert" className="text-destructive">{error}</p><Link className="text-primary underline" to="/login">Terug naar aanmelden</Link></> : <p>Je sessie wordt gecontroleerd…</p>}</main>;
}
