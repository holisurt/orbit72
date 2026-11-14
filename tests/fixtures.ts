// Load public/data JSON for tests (same files the app fetches at runtime).
import components from '../public/data/components.json';
import launchers from '../public/data/launchers.json';
import scenario from '../public/data/scenario_72h.json';
import lifetime from '../public/data/lifetime_6u.json';
import events from '../public/data/events.json';
import quiz from '../public/data/quiz.json';
import type { GameData } from '../src/data/types';

export const data = { components, launchers, scenario, lifetime, events, quiz } as unknown as GameData;

export const HANOI = { lat: 21.03, lon: 105.85 };

/** Reference design (SPEC §10): 6U: OBC, EPS, ADCS basic, S-band, SOS. */
export const REF_DESIGN = {
  chassis: '6U' as const,
  parts: ['obc', 'eps', 'adcs', 'sband', 'sos'],
  wings: false,
  envTest: false,
};

/** ±1 % relative tolerance. */
export function near(actual: number, expected: number, rel = 0.01): boolean {
  return Math.abs(actual - expected) <= Math.abs(expected) * rel;
}
