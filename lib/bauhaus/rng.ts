// Deterministic, seedable PRNG so every poster is reproducible from its seed.
// mulberry32 — small, fast, good enough distribution for visual generation.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next01: () => number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.next01 = mulberry32(this.seed);
  }

  /** float in [0, 1) */
  float(): number {
    return this.next01();
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + (max - min) * this.next01();
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** true with probability p (0..1) */
  chance(p: number): boolean {
    return this.next01() < p;
  }

  /** pick a random element */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next01() * arr.length)];
  }

  /** weighted pick — weights need not sum to 1 */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = this.next01() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Fisher–Yates shuffle (returns a new array) */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next01() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

/** A fresh random 32-bit seed (used when the user hits "regenerate"). */
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
}

/** Encode a seed as a short base36 string for URLs. */
export function seedToString(seed: number): string {
  return (seed >>> 0).toString(36);
}

export function stringToSeed(s: string): number | null {
  const n = parseInt(s, 36);
  return Number.isFinite(n) && n > 0 ? n >>> 0 : null;
}
