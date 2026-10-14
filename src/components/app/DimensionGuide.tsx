export function DimensionGuide({ kind = "product" }: { kind?: "product" | "box" | "pallet" }) {
  const pallet = kind === "pallet";
  return <aside className="dimension-guide max-w-full rounded-2xl border border-primary/15 bg-accent/50 p-3 sm:p-4" aria-label="Legende voor afmetingen">
    <div className="dimension-guide-content"><svg viewBox="0 0 240 150" role="img" aria-label="X is lengte, Y is breedte, Z is verticale hoogte" className="h-auto w-full max-w-[220px] shrink-0 self-center">
      <path d="M55 45 140 24 189 54 103 77Z" fill="#eff6ff" stroke="#64748b" strokeWidth="1.5" />
      <path d={`M55 45 103 77 103 ${pallet ? 98 : 122} 55 ${pallet ? 66 : 90}Z`} fill="#dbeafe" stroke="#64748b" strokeWidth="1.5" />
      <path d={`M103 77 189 54 189 ${pallet ? 75 : 99} 103 ${pallet ? 98 : 122}Z`} fill="#bfdbfe" stroke="#64748b" strokeWidth="1.5" />
      <path d="M105 134 191 111 m-8 -3 8 3 -5 7" fill="none" stroke="#2563eb" strokeWidth="3" />
      <path d="M43 98 89 130 m-1 -9 1 9 -9 -1" fill="none" stroke="#7c3aed" strokeWidth="3" />
      <path d="M204 99 204 48 m-5 7 5 -7 5 7" fill="none" stroke="#0f172a" strokeWidth="3" />
      <g fontFamily="system-ui" fontSize="11" fontWeight="700"><text x="137" y="147" fill="#1d4ed8">X · lengte</text><text x="3" y="118" fill="#6d28d9">Y · breedte</text><text x="177" y="35" fill="#0f172a">Z · hoogte</text></g>
    </svg><div className="min-w-0 space-y-2"><p className="text-sm font-semibold">{pallet ? "Zo meet je de pallet" : kind === "box" ? "Zo meet je de omdoos" : "Zo meet je het product"}</p><p className="text-xs leading-5 text-muted-foreground">X = lengte · Y = breedte · Z = hoogte. Meet in millimeters, in de uitgangspositie zoals op de tekening.</p><p className="text-xs leading-5">{pallet ? "Pallethoogte is alleen de basis. Maximale totale hoogte is de basis + alle dooslagen." : kind === "box" ? "Binnenmaten zijn de bruikbare ruimte in de doos. Buitenmaten omvatten het karton: binnenmaat + 2 × kartondikte." : "Vul de maten en het gewicht van één stuk in. Aantal is het gewenste aantal stuks in één omdoos."}</p><span className="inline-flex max-w-full rounded-lg border bg-card px-2 py-1 text-xs text-muted-foreground">Voorbeeld: 25 cm = 250 mm</span></div></div>
  </aside>;
}
