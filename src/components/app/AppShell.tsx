import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, FlaskConical, ShieldCheck, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/SessionContext";
import { usePackagingData } from "./PackagingDataProvider";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, profile } = useSession(), { storage } = usePackagingData(), navigate = useNavigate();
  const local = storage === "local";
  return <div lang="nl" className="min-h-screen min-w-0 overflow-x-clip bg-background text-foreground">
    <header className="border-b bg-card"><div className="mx-auto flex min-w-0 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Boxes aria-hidden="true" className="size-5" /></span><div className="min-w-0"><p className="truncate text-sm font-bold tracking-tight">Verpakkingsoptimalisatie</p><p className="hidden text-xs text-muted-foreground sm:block">Packing · maatwerk · palletisatie</p></div></div>
      {local ? <div className="flex min-w-0 flex-wrap items-center justify-end gap-2"><span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"><FlaskConical className="size-4 shrink-0" /> <span className="hidden xs:inline">Lokale testwerkruimte</span><span className="xs:hidden">Testmodus</span></span><Button size="sm" variant="outline" className="rounded-xl" onClick={() => { if (window.confirm("Testwerkruimte verlaten? Niet-geëxporteerde testgegevens verdwijnen. Er wordt niets naar Supabase overgezet.")) navigate(session ? "/" : "/login"); }}>{session ? "Privéwerkruimte" : "Aanmelden"}</Button></div> : <div className="flex min-w-0 flex-wrap items-center justify-end gap-2"><span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><ShieldCheck className="size-4" />Privéwerkruimte</span><span className="hidden max-w-52 truncate text-xs md:block" title={session?.user.email}>{session?.user.email}</span>{profile?.role === "admin" && <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => navigate("/users")}><UserRoundCog className="size-4" />Gebruikers</Button>}<Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/test")}>Lokaal testen</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={async () => { try { const { error } = await supabase.auth.signOut(); if (error) throw error; } catch (error) { toast.error(authErrorMessage(error)); } }}>Afmelden</Button></div>}
    </div></header>
    <main className="mx-auto min-w-0 max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">{local && <aside role="note" className="mb-5 flex min-w-0 items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-3 sm:p-4"><FlaskConical className="mt-0.5 size-5 shrink-0 text-primary" /><div className="min-w-0"><p className="text-sm font-semibold">Je test zonder account · alles blijft in het browsergeheugen</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Deze werkruimte staat los van Supabase. Voeg eigen omdozen toe of importeer Excelbestanden; bij herladen of verlaten verdwijnen testgegevens.</p></div></aside>}{children}</main>
    <footer className="mx-auto max-w-[1600px] border-t px-3 py-5 text-xs leading-relaxed text-muted-foreground sm:px-6">{local ? "Lokale testopslag · niet gekoppeld aan Supabase" : "Supabase-opslag"} · geometrisch gevalideerde placements · heuristische zoekdekking</footer>
  </div>;
}
