import type { ReactNode } from "react";
import { Boxes, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/infrastructure/auth-error";

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useSession();
  return <div lang="nl" className="min-h-screen min-w-0 overflow-x-clip bg-background text-foreground"><header className="border-b bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Boxes aria-hidden="true" className="size-5" /></span><div><p className="text-sm font-bold tracking-tight">Verpakkingsoptimalisatie</p><p className="text-xs text-muted-foreground">Packing · maatwerk · palletisatie</p></div></div><div className="flex min-w-0 flex-wrap items-center gap-3"><span className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="size-4" />Privéwerkruimte</span><span className="max-w-52 truncate text-xs" title={session?.user.email}>{session?.user.email}</span><Button size="sm" variant="outline" className="rounded-xl" onClick={async () => { try { const { error } = await supabase.auth.signOut(); if (error) throw error; } catch (error) { toast.error(authErrorMessage(error)); } }}>Afmelden</Button></div></div></header>
    <main className="mx-auto min-w-0 max-w-7xl px-3 py-5 sm:px-6">{children}</main><footer className="mx-auto max-w-7xl border-t px-4 py-5 text-xs leading-relaxed text-muted-foreground sm:px-6">Supabase-opslag · geometrisch gevalideerde placements · heuristische zoekdekking · geen CERM-koppeling of transportcertificering</footer>
  </div>;
}
