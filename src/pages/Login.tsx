import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Link, Navigate } from "react-router-dom";
import { Boxes, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContext";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { session, loading, recovery, error } = useSession();
  if (!loading && session) return <Navigate to={recovery ? "/reset-password" : "/"} replace />;
  return <main lang="nl" className="grid min-h-screen place-items-center bg-secondary/40 p-5"><section className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-sm">
    <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Boxes /></span>
    <h1 className="text-2xl font-semibold tracking-tight">Verpakkingsoptimalisatie</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">Meld je aan voor je eigen verpakkingen, definities en opgeslagen oplossingen.</p>
    <div className="mb-6 space-y-2 rounded-2xl border bg-secondary/40 p-4"><Button asChild variant="outline" className="w-full rounded-xl bg-card"><Link to="/test">Testen zonder account</Link></Button><p className="text-xs leading-relaxed text-muted-foreground">Berekeningen, Excelimports en beheeracties in een lege lokale werkruimte. Geen Supabase-data; gegevens verdwijnen bij herladen of verlaten.</p></div>
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    <Auth supabaseClient={supabase} redirectTo={new URL('/auth/callback', window.location.origin).href} providers={[]} theme="light" appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: 'hsl(166, 52%, 29%)', brandAccent: 'hsl(166, 52%, 23%)', inputText: 'hsl(166, 25%, 16%)', inputBackground: '#fff', inputBorder: 'hsl(150, 15%, 80%)', inputLabelText: 'hsl(166, 25%, 16%)' }, radii: { borderRadiusButton: '12px', buttonBorderRadius: '12px', inputBorderRadius: '12px' } } } }} />
    <p className="mt-6 flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />Een privéwerkruimte per gebruiker. Er worden geen originele Excelbestanden opgeslagen.</p>
  </section></main>;
}
