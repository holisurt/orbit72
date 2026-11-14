// Launch campaign — SPEC §1 (giam_doc: launch fail 3 %/launch, seeded RNG) and design/HF-Launch:
// a failed launch is replaced if budget remains (+3 months); otherwise that plane is lost.

export const REPLACEMENT_MONTHS = 3; // [GA] HF-Launch

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash → 32-bit seed. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface LaunchAttempt {
  launch: number; // 0-based; = plane index for one-plane-per-launch vehicles
  failed: boolean;
  replaced: boolean;
}

export interface LaunchOutcome {
  attempts: LaunchAttempt[];
  lostPlanes: number[];
  extraCostKusd: number;
  extraMonths: number;
  inOrbit: boolean; // every plane reached orbit
}

export interface LaunchInput {
  launches: number;
  planesPerLaunch: number; // ISS: all planes (=1) in one deployment
  costPerLaunchKusd: number;
  failProb: number;
  budgetKusd: number;
  costKusd: number; // nominal total
  rng: () => number;
}

export function simulateLaunches(i: LaunchInput): LaunchOutcome {
  const attempts: LaunchAttempt[] = [];
  const lostPlanes: number[] = [];
  let extraCostKusd = 0;
  let extraMonths = 0;
  for (let l = 0; l < i.launches; l++) {
    let up = i.rng() >= i.failProb;
    if (up) {
      attempts.push({ launch: l, failed: false, replaced: false });
      continue;
    }
    // failed: buy replacements while budget allows
    while (!up && i.budgetKusd - (i.costKusd + extraCostKusd) >= i.costPerLaunchKusd) {
      extraCostKusd += i.costPerLaunchKusd;
      extraMonths += REPLACEMENT_MONTHS;
      up = i.rng() >= i.failProb;
    }
    attempts.push({ launch: l, failed: true, replaced: up });
    if (!up) for (let p = 0; p < i.planesPerLaunch; p++) lostPlanes.push(l * i.planesPerLaunch + p);
  }
  return { attempts, lostPlanes, extraCostKusd, extraMonths, inOrbit: lostPlanes.length === 0 };
}
