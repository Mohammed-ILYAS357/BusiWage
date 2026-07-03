// Generates a short, unique-enough id for new records (workers, sites,
// work sessions...). We don't need anything fancy since everything lives
// only on this one device.

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
