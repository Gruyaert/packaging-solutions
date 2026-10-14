export interface ViewerPalette {
  readonly productBase: (productIndex: number) => string;
  readonly boxColor: (productIndex: number, shadeIndex: number, layerIndex: number, mode?: "product" | "tints" | "layers") => string;
  readonly wireColor: (productIndex: number) => string;
  readonly textColor: (color: string) => string;
  readonly bounds: string;
  readonly pallet: string;
  readonly selected: string;
  readonly hover: string;
}

export const VIEWER_PRODUCT_PALETTE = ["#2563eb", "#7c3aed", "#d97706", "#db2777", "#0891b2", "#16a34a", "#dc2626", "#9333ea"] as const;
const SHADE_OFFSETS = [0.12, -0.1, 0.06, -0.16, 0, 0.18, -0.05, 0.09] as const;

function hexChannel(value: string) {
  return Number.parseInt(value, 16);
}
function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
}
function mix(color: string, target: string, amount: number) {
  const source = color.replace("#", ""), destination = target.replace("#", "");
  return `#${toHex(hexChannel(source.slice(0, 2)) * (1 - amount) + hexChannel(destination.slice(0, 2)) * amount)}${toHex(hexChannel(source.slice(2, 4)) * (1 - amount) + hexChannel(destination.slice(2, 4)) * amount)}${toHex(hexChannel(source.slice(4, 6)) * (1 - amount) + hexChannel(destination.slice(4, 6)) * amount)}`;
}
function luminance(color: string) {
  const source = color.replace("#", "");
  const channels = [0, 2, 4].map(offset => hexChannel(source.slice(offset, offset + 2)) / 255).map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function productBaseColor(productIndex: number) {
  return VIEWER_PRODUCT_PALETTE[((productIndex % VIEWER_PRODUCT_PALETTE.length) + VIEWER_PRODUCT_PALETTE.length) % VIEWER_PRODUCT_PALETTE.length];
}

export function viewerBoxColor(productIndex: number, shadeIndex: number, layerIndex: number, mode: "product" | "tints" | "layers" = "tints") {
  const base = productBaseColor(productIndex);
  if (mode === "product") return base;
  const offset = mode === "layers" ? (layerIndex % 2 ? -0.14 : 0.12) : SHADE_OFFSETS[((shadeIndex % SHADE_OFFSETS.length) + SHADE_OFFSETS.length) % SHADE_OFFSETS.length];
  return offset >= 0 ? mix(base, "#ffffff", offset) : mix(base, "#0f172a", Math.abs(offset));
}

export function viewerWireColor(productIndex: number) {
  return mix(productBaseColor(productIndex), "#0f172a", 0.34);
}

export function viewerTextColor(color: string) {
  return luminance(color) > 0.45 ? "#0f172a" : "#ffffff";
}

export function createViewerPalette(): ViewerPalette {
  const bases = ["#2563eb", "#7c3aed", "#d97706", "#db2777", "#0891b2", "#16a34a", "#dc2626", "#9333ea"];
  const offsets = [0.12, -0.1, 0.06, -0.16, 0, 0.18, -0.05, 0.09];
  const channel = (value: string) => Number.parseInt(value, 16);
  const hex = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  const mixColor = (color: string, target: string, amount: number) => {
    const source = color.replace("#", ""), destination = target.replace("#", "");
    return `#${[0, 2, 4].map(offset => hex(channel(source.slice(offset, offset + 2)) * (1 - amount) + channel(destination.slice(offset, offset + 2)) * amount)).join("")}`;
  };
  const productBase = (index: number) => bases[((index % bases.length) + bases.length) % bases.length];
  const boxColor = (index: number, shade: number, layer: number, mode: "product" | "tints" | "layers" = "tints") => {
    const base = productBase(index);
    if (mode === "product") return base;
    const offset = mode === "layers" ? (layer % 2 ? -0.14 : 0.12) : offsets[((shade % offsets.length) + offsets.length) % offsets.length];
    return offset >= 0 ? mixColor(base, "#ffffff", offset) : mixColor(base, "#0f172a", Math.abs(offset));
  };
  const wireColor = (index: number) => mixColor(productBase(index), "#0f172a", 0.34);
  const textColor = (color: string) => {
    const source = color.replace("#", ""), channels = [0, 2, 4].map(offset => channel(source.slice(offset, offset + 2)) / 255).map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] > 0.45 ? "#0f172a" : "#ffffff";
  };
  return { productBase, boxColor, wireColor, textColor, bounds: "#475569", pallet: "#94a3b8", selected: "#0f172a", hover: "#f59e0b" };
}