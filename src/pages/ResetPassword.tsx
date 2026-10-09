import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";
import { useSession } from "@/components/auth/SessionContext";

export default function ResetPassword() {
  const { session, loading, finishRecovery } = useSession();
  const [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return <main lang="nl" className="grid min-h-screen place-items-center bg-secondary/40 p-5"><section className="w-full max-w-md space-y-5 rounded-3xl border bg-card p-7"><h1 className="text-2xl font-semibold">Nieuw wachtwoord</h1>
    {loading ? <p>Sessie controleren…</p> : !session ? <><p>Open een geldige herstelmail om je wachtwoord te wijzigen.</p><Link to="/login" className="text-primary underline">Vraag een nieuwe herstelmail aan</Link></> : <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setError(""); if (password !== confirmation) { setError("De wachtwoorden komen niet overeen."); return; } setBusy(true); try { const { error: failure } = await supabase.auth.updateUser({ password }); if (failure) throw failure; finishRecovery(); navigate("/", { replace: true }); } catch (failure) { setError(authErrorMessage(failure)); } finally { setBusy(false); } }}>
      <label className="block space-y-2 text-sm">Nieuw wachtwoord<Input className="rounded-xl" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block space-y-2 text-sm">Herhaal wachtwoord<Input className="rounded-xl" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full rounded-xl" disabled={busy}>{busy ? "Opslaan…" : "Wachtwoord opslaan"}</Button>
    </form>}
  </section></main>;
}
