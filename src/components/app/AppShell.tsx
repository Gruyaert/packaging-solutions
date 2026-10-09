import type { ReactNode } from "react";
import { Boxes, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div lang="nl" className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Boxes aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight">Verpakkingsoptimalisatie</p>
              <p className="text-xs text-muted-foreground">Reconstructie · contractbasis</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2 rounded-full border-border bg-secondary px-3 py-1.5 font-medium text-secondary-foreground">
            <FileCheck2 aria-hidden="true" className="size-3.5" /> Contractversie 0.1
          </Badge>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">{children}</main>
      <footer className="mx-auto max-w-6xl border-t px-5 py-6 text-xs leading-relaxed text-muted-foreground sm:px-8">
        Voorlopig appskelet · geen gereconstrueerde Zite-interface · geen operationele gegevensopslag
      </footer>
    </div>
  );
}
