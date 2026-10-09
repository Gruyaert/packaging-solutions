import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Boxes, FlaskConical, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";
import { usePackagingData } from "./PackagingDataProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { storageMode, records } = usePackagingData();
  const local = storageMode === "local";
  const hasLocalData = local && Object.values(records).some(rows => rows.length > 0);
  return <div lang="nl" className="min-h-screen min-w-0 overflow-x-clip bg-background text-foreground"><header className="border-b bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Boxes aria-hidden="true" className="size-5" /></span><div><p className="text-sm font-bold tracking-tight">Verpakkingsoptimalisatie</p><p className="text-xs text-muted-foreground">Packing · maatwerk · palletisatie</p></div></div><div className="flex min-w-0 flex-wrap items-center gap-3">
    {local ? <><span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"><FlaskConical className="size-4" />Lokale testmodus</span><Button asChild size="sm" variant="outline" className="rounded-xl"><Link to={session ? "/" : "/login"} onClick={e => { if (hasLocalData && !window.confirm("Bij verlaten verdwijnen de lokale testgegevens. Exporteer ze eerst als je ze wilt bewaren. Toch doorgaan?")) e.preventDefault(); }}>{session ? "Naar privéwerkruimte" : "Aanmelden"}</Link></Button></> : <><span className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="size-4" />Privéwerkruimte</span><span className="max-w-52 truncate text-xs" title={session?.user.email}>{session?.user.email}</span><Button asChild size="sm" variant="ghost" className="rounded-xl"><Link to="/test">Testen zonder account</Link></Button><Button size="sm" variant="outline" className="rounded-xl" onClick={async () => { try { const { error } = await supabase.auth.signOut(); if (error) throw error; } catch (error) { toast.error(authErrorMessage(error)); } }}>Afmelden</Button></>}
    </div></div></header>
    {local && <aside className="border-b bg-secondary/60" aria-label="Lokale testmodus"><div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm sm:px-6"><FlaskConical className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Testen zonder account · alleen in deze pagina</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Start met je eigen omdozen/producten of importeer een Excelbestand. Opslaan en beheeracties werken lokaal: er worden geen Supabase-werkruimtegegevens gelezen of gewijzigd. Bij herladen of verlaten verdwijnen de testgegevens. Bewaar ze vooraf via Rapporten / Exports; er is geen automatische overdracht naar je account.</p></div></div></aside>}
    <main className="mx-auto min-w-0 max-w-7xl px-3 py-5 sm:px-6">{children}</main><footer className="mx-auto max-w-7xl border-t px-4 py-5 text-xs leading-relaxed text-muted-foreground sm:px-6">{local ? "Tijdelijke browseropslag · geen Supabase-dataopslag" : "Supabase-opslag"} · geometrisch gevalideerde placements · heuristische zoekdekking · geen CERM-koppeling of transportcertificering</footer>
  </div>;
}
