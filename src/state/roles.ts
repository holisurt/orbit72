// Co-op roles and priority cards — SPEC §8, text from design/HF-Setup.
import type { CardSide, PlayerCount, RoleId } from './store';

export interface RoleInfo {
  id: RoleId;
  name: string;
  ab: string;
  color: string;
  duty: string;
  cards: Record<CardSide, string>;
}

export const ROLES: Record<RoleId, RoleInfo> = {
  FD: {
    id: 'FD',
    name: 'Flight Director',
    ab: 'FD',
    color: '#A78BFA',
    duty: 'Budget, schedule, final call, incidents; runs the Go/No-Go poll.',
    cards: { a: 'Cost ≤ 90% of budget', b: 'Reserve ≥ 200k' },
  },
  VT: {
    id: 'VT',
    name: 'Spacecraft Engineer',
    ab: 'SE',
    color: '#4ADE80',
    duty: 'Chassis, power, battery, mass, testing.',
    cards: { a: 'Power margin ≥ 20%', b: 'Environmental testing done' },
  },
  KH: {
    id: 'KH',
    name: 'Mission Scientist',
    ab: 'MS',
    color: '#F5A524',
    duty: 'SOS relay payload, data, rescue value.',
    cards: { a: 'Data made ≤ 50% of the daily downlink', b: 'SOS delivered within 1 h ≥ 55%' },
  },
  QD: {
    id: 'QD',
    name: 'Orbit & Comms Engineer',
    ab: 'OC',
    color: '#3DD6F5',
    duty: 'Inclination, altitude, orbital planes, launcher, radio links.',
    cards: { a: 'Coverage gap ≤ 3.0 h', b: 'Every link margin ≥ 6 dB' },
  },
};

/** Players → roles (SPEC §8). */
export const ROLE_GROUPS: Record<PlayerCount, RoleId[][]> = {
  4: [['FD'], ['VT'], ['KH'], ['QD']],
  3: [['FD'], ['VT', 'KH'], ['QD']],
  2: [['FD', 'QD'], ['VT', 'KH']],
};

export function playerForRole(count: PlayerCount, role: RoleId): number {
  return ROLE_GROUPS[count].findIndex((g) => g.includes(role));
}

export function dealCards(rand: () => number = Math.random): Record<RoleId, CardSide> {
  const pick = (): CardSide => (rand() < 0.5 ? 'a' : 'b');
  return { FD: pick(), VT: pick(), KH: pick(), QD: pick() };
}
