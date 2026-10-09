import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORIENTATIONS, type Product } from "@/domain/packing/types";
export interface ProductDraft extends Product { inputWeight: number; weightUnit: "g" | "kg" }
export function newProduct(index: number): ProductDraft {
  return { productId: `product-${index}`, reference: "", length: 0, width: 0, height: 0, weightKg: 0, quantity: 1, rotations: ["L-B-H"], maxInLength: 100, maxInWidth: 100, maxLayers: 100, inputWeight: 0, weightUnit: "kg" };
}
export function NumberField({ label, value, onChange, min = 0, step = "any" }: { label: string; value: number; onChange(value: number): void; min?: number; step?: string }) {
  return <label className="block min-w-0 space-y-1 text-xs font-medium">{label}<Input className="rounded-xl bg-card" type="number" min={min} step={step} value={Number.isNaN(value) ? "" : value} onChange={e => onChange(e.target.value === "" ? NaN : Number(e.target.value))} /></label>;
}
export function ProductInputs({ products, onChange }: { products: ProductDraft[]; onChange(products: ProductDraft[]): void }) {
  const update = (index: number, patch: Partial<ProductDraft>) => onChange(products.map((p, i) => i === index ? { ...p, ...patch } : p));
  return <section className="space-y-4" aria-label="Productinvoer">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Producten · {products.length}/5</h3><Button type="button" variant="outline" className="rounded-xl" disabled={products.length >= 5} onClick={() => onChange([...products, newProduct(Math.max(...products.map(p => Number(p.productId.split("-")[1]))) + 1)])}>Product toevoegen</Button></div>
    {products.map((p, index) => <fieldset key={p.productId} className="space-y-4 rounded-2xl border bg-secondary/40 p-4">
      <legend className="px-2 text-sm font-semibold">Product {index + 1}{index === 0 ? " · verplicht" : ""}</legend>
      <div className="flex gap-3"><label className="flex-1 space-y-1 text-xs font-medium">Referentie<Input className="rounded-xl bg-card" value={p.reference} onChange={e => update(index, { reference: e.target.value })} /></label>{index > 0 && <Button type="button" variant="ghost" className="self-end rounded-xl" onClick={() => onChange(products.filter((_, i) => i !== index))}>Verwijderen</Button>}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField label="L / X (mm)" value={p.length} min={0.001} onChange={length => update(index, { length })} />
        <NumberField label="B / Y (mm)" value={p.width} min={0.001} onChange={width => update(index, { width })} />
        <NumberField label="H / Z (mm)" value={p.height} min={0.001} onChange={height => update(index, { height })} />
        <NumberField label="Aantal" value={p.quantity} min={1} step="1" onChange={quantity => update(index, { quantity })} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <NumberField label="Gewicht (max. 3 decimalen)" value={p.inputWeight} step="0.001" onChange={inputWeight => update(index, { inputWeight })} />
        <label className="space-y-1 text-xs font-medium">Eenheid<select className="h-10 w-full rounded-xl border bg-card px-3" value={p.weightUnit} onChange={e => update(index, { weightUnit: e.target.value as "g" | "kg" })}><option value="kg">kg</option><option value="g">g</option></select></label>
        <NumberField label="Max. in lengte" min={1} step="1" value={p.maxInLength} onChange={maxInLength => update(index, { maxInLength })} />
        <NumberField label="Max. in breedte" min={1} step="1" value={p.maxInWidth} onChange={maxInWidth => update(index, { maxInWidth })} />
        <NumberField label="Max. lagen" min={1} step="1" value={p.maxLayers} onChange={maxLayers => update(index, { maxLayers })} />
      </div>
      <div><p className="mb-2 text-xs font-medium">Toegelaten rotaties</p><div className="flex flex-wrap gap-2">{ORIENTATIONS.map(r => <label key={r} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs"><input type="checkbox" checked={p.rotations.includes(r)} onChange={e => update(index, { rotations: e.target.checked ? [...p.rotations, r] : p.rotations.filter(q => q !== r) })} />{r}</label>)}</div></div>
    </fieldset>)}
    <p className="text-xs text-muted-foreground">Maxima tellen startposities per product/laag en gebruikte lagen. Compressibility volgt later; nominale maten worden nooit verkleind.</p>
  </section>;
}
