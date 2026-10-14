import { EPS, ORIENTATIONS, rotated, type Box, type Placement, type Product, type Spacing, type ValidationJSON } from "./types";
import { inBounds, indexLayers, overlaps, respectsMaxima, supported } from "./geometry";

export function validatePlacements(products: Product[], box: Box, spacing: Spacing, placements: Placement[], requireExact = false): ValidationJSON {
  const errors: string[] = [], warnings: string[] = [], outside: string[] = [], unsupported: string[] = [], pairs: string[][] = [];
  const counts: Record<string, number> = Object.fromEntries(products.map(p => [p.productId, 0]));
  const productById = new Map(products.map(product => [product.productId, product]));
  const dimensionsByRotation = new Map<string, ReturnType<typeof rotated>>();
  const ids = new Set<string>();
  const indexed = indexLayers(placements);
  for (let i = 0; i < placements.length; i++) {
    const p = placements[i], product = productById.get(p.productId);
    if (!p.placementId || ids.has(p.placementId)) errors.push(`Dubbele/lege placementId: ${p.placementId}`);
    ids.add(p.placementId);
    if (![p.x, p.y, p.z, p.length, p.width, p.height].every(Number.isFinite) || Math.min(p.length, p.width, p.height) <= 0) errors.push(`Ongeldige geometrie: ${p.placementId}`);
    if (!product) errors.push(`Onbekend productId: ${p.productId}`);
    else {
      counts[p.productId]++;
      if (!ORIENTATIONS.includes(p.orientation) || !product.rotations.includes(p.orientation)) errors.push(`Rotatie niet toegestaan: ${p.placementId}`);
      else {
        const dimensionKey = `${p.productId}|${p.orientation}`;
        const dims = dimensionsByRotation.get(dimensionKey) ?? rotated(product, p.orientation);
        dimensionsByRotation.set(dimensionKey, dims);
        if (["length", "width", "height"].some(k => Math.abs(p[k as keyof typeof dims] - dims[k as keyof typeof dims]) > EPS)) errors.push(`Nominale maten gewijzigd: ${p.placementId}`);
      }
      if (!respectsMaxima(p, placements.filter(q => q.placementId !== p.placementId), product)) errors.push(`Productmaxima overschreden: ${p.placementId}`);
    }
    if (!inBounds(p, box, spacing)) outside.push(p.placementId);
    if (!supported(p, placements)) unsupported.push(p.placementId);
    if (!Number.isInteger(p.layerIndex) || p.layerIndex !== indexed[i].layerIndex) errors.push(`Onlogische layerIndex: ${p.placementId}`);
    for (let j = i + 1; j < placements.length; j++) if (overlaps(p, placements[j])) pairs.push([p.placementId, placements[j].placementId]);
  }
  if (outside.length) errors.push("Placements buiten bruikbare doosruimte/speling.");
  if (unsupported.length) errors.push("Zwevende of onvoldoende ondersteunde producten.");
  if (pairs.length) errors.push("Overlappende placements.");
  for (const product of products) {
    if (counts[product.productId] !== product.quantity) (requireExact ? errors : warnings).push(`${product.reference}: ${counts[product.productId]} geplaatst, ${product.quantity} gevraagd.`);
  }
  if (!placements.length) errors.push("Geen producten geplaatst.");
  return { status: errors.length ? "invalid" : "valid", warnings, errors, counts, overlapAnalysis: { valid: !pairs.length, pairs }, gravityCheck: { valid: !unsupported.length, unsupported }, boundsCheck: { valid: !outside.length, outside } };
}
