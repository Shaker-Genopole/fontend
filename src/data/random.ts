/**
 * Seeded PRNG (mulberry32) so that the simulated dataset is reproducible
 * across builds and reviewers see identical figures.
 */
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    float: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) =>
      Math.floor(min + next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T =>
      items[Math.floor(next() * items.length)],
    hex: (bytes: number) =>
      Array.from({ length: bytes }, () =>
        Math.floor(next() * 256)
          .toString(16)
          .padStart(2, '0')
      ).join(''),
    /** Approximately normal sample (Irwin–Hall, n = 6). */
    normal: (mean: number, sd: number) => {
      let s = 0
      for (let i = 0; i < 6; i++) s += next()
      return mean + (s - 3) * sd * Math.SQRT2
    },
  }
}

export function round(value: number, digits = 2) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export function median(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function shortHash(value: string, head = 6, tail = 4) {
  const v = value.startsWith('0x') ? value : `0x${value}`
  return `${v.slice(0, head + 2)}…${v.slice(-tail)}`
}
