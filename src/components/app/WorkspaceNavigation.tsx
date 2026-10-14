import { ChevronDown, FileDown, FolderCog, Layers3, MoreHorizontal, PackageSearch, Save, Shapes, Box, Boxes, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const primary = [
  { value: "search", label: "Verpakking zoeken", icon: PackageSearch },
  { value: "custom", label: "Omdoos op maat", icon: Box },
  { value: "solutions", label: "Opgeslagen oplossingen", icon: Save },
  { value: "pallet", label: "Palletisatie", icon: Layers3 },
] as const;
const secondary = [
  { value: "cartons", label: "Omdozenbeheer", icon: Boxes },
  { value: "shapes", label: "Shapes masterdata", icon: Shapes },
  { value: "definitions", label: "Verpakkingsdefinities", icon: FolderCog },
  { value: "reports", label: "Rapporten & exports", icon: FileDown },
  { value: "debug", label: "Debug / performance", icon: Gauge },
] as const;

export function WorkspaceNavigation({ value, onNavigate }: { value: string; onNavigate(value: string): void }) {
  return <nav aria-label="Werkruimteonderdelen" className="rounded-2xl border bg-card p-2 shadow-sm">
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
        {primary.map(({ value: itemValue, label, icon: Icon }) => <button key={itemValue} type="button" onClick={() => onNavigate(itemValue)} aria-current={value === itemValue ? "page" : undefined} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:justify-start sm:px-3 ${value === itemValue ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon aria-hidden="true" className="size-4 shrink-0" /><span className="hidden truncate sm:block">{label}</span><span className="sr-only sm:hidden">{label}</span></button>)}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant={secondary.some(item => item.value === value) ? "secondary" : "outline"} size="sm" className="h-10 shrink-0 gap-1.5 rounded-xl px-3 text-xs font-semibold"><MoreHorizontal className="size-4" /><span className="hidden sm:inline">Meer</span><ChevronDown className="size-3.5" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
          <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">Beheer en aanvullende flows</DropdownMenuLabel><DropdownMenuSeparator />
          {secondary.map(({ value: itemValue, label, icon: Icon }) => <DropdownMenuItem key={itemValue} onSelect={() => onNavigate(itemValue)} className={`gap-3 rounded-lg px-3 py-2.5 text-sm ${value === itemValue ? "bg-accent text-primary" : ""}`}><Icon className="size-4" />{label}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </nav>;
}
