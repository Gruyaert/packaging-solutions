import { useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Link, Navigate } from "react-router-dom";
import { Boxes, FlaskConical, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";
import { useSession } from "@/components/auth/SessionContext";

export default function Login() {
  const { session, loading, recovery, error } = useSession();
  const [forgotOpen, setForgotOpen] = useState(false), [resetEmail, setResetEmail] = useState(""), [resetBusy, setResetBusy] = useState(false), [resetSent, setResetSent] = useState(false), [resetError, setResetError] = useState("");
  if (!loading && session) return <Navigate to={recovery ? "/reset-password" : "/"} replace />;
  async function requestReset(event: React.FormEvent) {
    event.preventDefault(); setResetBusy(true); setResetError(""); setResetSent(false);
    try {
      const redirectTo = new URL("/reset-password", window.location.origin).href;
      const { error: failure } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo });
      if (failure) throw failure;
      setResetSent(true);
    } catch (failure) { setResetError(authErrorMessage(failure)); }
    finally { setResetBusy(false); }
  }
  return <main lang="nl" className="grid min-h-screen place-items-center bg-secondary/40 p-5"><section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-sm">
    <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Boxes /></span>
    <h1 className="text-2xl font-semibold tracking-tight">Verpakkingsoptimalisatie</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">Meld je aan voor je eigen verpakkingen, definities en opgeslagen oplossingen.</p>
    <div className="mb-6 space-y-2 rounded-2xl border bg-secondary/40 p-4"><Button asChild variant="secondary" className="w-full gap-2 rounded-xl border border-primary/20 font-semibold"><Link to="/test"><FlaskConical className="size-4" />Testen zonder account</Link></Button><p className="text-xs leading-5 text-muted-foreground">Alle functies uitproberen met eigen invoer en Excelbestanden. Alleen browsergeheugen: geen Supabase-opslag; herladen wist de testwerkruimte.</p></div>
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    <Auth supabaseClient={supabase} redirectTo={new URL("/auth/callback", window.location.origin).href} providers={[]} theme="light" appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: "hsl(166, 52%, 29%)", brandAccent: "hsl(166, 52%, 23%)", inputText: "hsl(166, 25%, 16%)", inputBackground: "#fff", inputBorder: "hsl(150, 15%, 80%)", inputLabelText: "hsl(166, 25%, 16%)" }, radii: { borderRadiusButton: "12px", buttonBorderRadius: "12px", inputBorderRadius: "12px" } } } }} />
    <div className="mt-5 border-t pt-5"><Button type="button" variant="ghost" className="w-full rounded-xl text-primary" onClick={() => { setForgotOpen(open => !open); setResetError(""); setResetSent(false); }}>{forgotOpen ? "Herstel sluiten" : "Wachtwoord vergeten?"}</Button>{forgotOpen && <form className="mt-3 space-y-3 rounded-2xl border bg-secondary/30 p-4" onSubmit={requestReset}><div className="flex items-center gap-2"><Mail className="size-4 text-primary" /><p className="text-sm font-semibold">Wachtwoord resetten via e-mail</p></div><p className="text-xs leading-5 text-muted-foreground">Vul je account-e-mailadres in. Je ontvangt een beveiligde link om een nieuw wachtwoord te kiezen.</p><label className="block space-y-1.5 text-xs font-semibold">E-mailadres<Input required type="email" autoComplete="email" value={resetEmail} onChange={event => setResetEmail(event.target.value)} placeholder="naam@bedrijf.be" className="rounded-xl bg-card" /></label>{resetError && <p role="alert" className="text-xs text-destructive">{resetError}</p>}{resetSent && <p role="status" className="text-xs text-primary">Als dit account bestaat, is een resetmail verstuurd. Controleer ook je spamfolder.</p>}<Button disabled={resetBusy} className="w-full rounded-xl">{resetBusy ? "Versturen…" : "Resetmail versturen"}</Button></form>}</div>
    <p className="mt-6 flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />Een privéwerkruimte per gebruiker. Er worden geen originele Excelbestanden opgeslagen.</p>
  </section></main>;
}
