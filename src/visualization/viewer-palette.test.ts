import { describe, expect, it } from "vitest";
import { createViewerPalette, productBaseColor, viewerBoxColor, viewerTextColor, viewerWireColor } from "./viewer-palette";

describe("viewer palette", () => {
  it("keeps product families stable and cycles deterministically", () => {
    expect(productBaseColor(0)).toBe(productBaseColor(8));
    expect(viewerBoxColor(0, 0, 0)).toBe(viewerBoxColor(0, 0, 0));
    expect(viewerBoxColor(0, 0, 0)).not.toBe(viewerBoxColor(0, 1, 0));
  });

  it("keeps tint variants within the same product family", () => {
    const base = productBaseColor(2);
    const variants = [0, 1, 2, 3].map(shade => viewerBoxColor(2, shade, 0));
    expect(variants.every(color => color.startsWith("#"))).toBe(true);
    expect(variants).not.toContain(base);
  });

  it("provides readable foreground colors and shared runtime defaults", () => {
    expect(viewerTextColor("#ffffff")).toBe("#0f172a");
    expect(viewerTextColor("#0f172a")).toBe("#ffffff");
    expect(createViewerPalette().pallet).toBe("#94a3b8");
  });

  it("uses a stable darker family tint for product wireframes", () => {
    expect(viewerWireColor(0)).toBe(createViewerPalette().wireColor(0));
    expect(viewerWireColor(0)).not.toBe(productBaseColor(0));
    expect(viewerWireColor(0)).not.toBe("#475569");
    expect(viewerWireColor(0)).toBe(viewerWireColor(8));
  });
});