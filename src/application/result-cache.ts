// Memory only; capped by entry count and serialized result size. No workspace data persists.
export function createResultCache<T>(maxEntries = 2, maxBytes = 8 * 1024 * 1024) {
  const entries = new Map<string, { value: T; bytes: number }>();
  let bytes = 0;
  return {
    get(key: string): T | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      entries.delete(key); entries.set(key, entry);
      return structuredClone(entry.value);
    },
    set(key: string, value: T) {
      const size = new TextEncoder().encode(key + JSON.stringify(value)).byteLength;
      const old = entries.get(key);
      if (old) { bytes -= old.bytes; entries.delete(key); }
      if (size > maxBytes) return;
      while (entries.size && (entries.size >= maxEntries || bytes + size > maxBytes)) {
        const first = entries.keys().next().value!;
        bytes -= entries.get(first)!.bytes; entries.delete(first);
      }
      entries.set(key, { value: structuredClone(value), bytes: size }); bytes += size;
    },
    clear() { entries.clear(); bytes = 0; },
    size: () => entries.size,
  };
}
