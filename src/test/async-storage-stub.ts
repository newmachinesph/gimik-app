/**
 * AsyncStorage under node.
 *
 * The store persists through AsyncStorage, whose real module is native-only.
 * The unit tests never exercise persistence - they test the pure layer that
 * happens to sit downstream of a module that imports it - so an in-memory map
 * keeps the import graph resolvable without pretending to be a device.
 */
const memory = new Map<string, string>();

export default {
  getItem: async (key: string) => memory.get(key) ?? null,
  setItem: async (key: string, value: string) => void memory.set(key, value),
  removeItem: async (key: string) => void memory.delete(key),
  clear: async () => void memory.clear(),
  getAllKeys: async () => [...memory.keys()],
};
