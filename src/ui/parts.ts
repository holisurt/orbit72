// Part display copy from design/HF-Build (abbreviation + "why" text). Numbers come from data/sim.
import type { Part, PartCat } from '../data/types';
import { downlinkBytesPerDay, linkMarginFor, type LinkId } from '../sim/link';
import { fmt } from './format';

export const CAT_COLOR: Record<PartCat, string> = {
  bus: '#CBD5E1', // light slate (no cyan in the v1.2 palette)
  pow: '#4ADE80',
  com: '#A78BFA',
  pay: '#F5A524',
  ext: '#94A3B8',
};

export const CAT_TABS: { id: PartCat; name: string }[] = [
  { id: 'bus', name: 'Computer' },
  { id: 'pow', name: 'Power' },
  { id: 'com', name: 'Radio' },
  { id: 'pay', name: 'Payload' },
  { id: 'ext', name: 'Extras' },
];

/**
 * Downlink per day at the given contact minutes — same rule as the HUD Data bar
 * (2 decimals below 10 MB, else integer). E.g. "≈ 250 MB/day with 16.7 min of contact".
 */
export function downlinkText(rbps: number, contactMinPerDay: number): string {
  const mb = downlinkBytesPerDay(rbps, contactMinPerDay) / 1e6;
  const min = Number.isInteger(contactMinPerDay) ? fmt(contactMinPerDay, 0) : fmt(contactMinPerDay, 1);
  return `≈ ${fmt(mb, mb < 10 ? 2 : 0)} MB/day with ${min} min of contact`;
}

/** Parts whose card shows a link margin, and the link they use. */
export const PART_LINK: Partial<Record<string, LinkId>> = { uhf: 'uhf', sband: 's', sos: 'sos' };

/**
 * Detail-card text for a part. "{dl}" → computed downlink; "{m}" → link margin to Hoa Lac at the current
 * altitude and minimum elevation, from the same function as the Orbit screen's R7 panel.
 */
export function partWhy(p: Part, contactMinPerDay: number, hKm: number, elevDeg: number): string {
  let why = PART_INFO[p.id]?.why ?? '';
  if (p.rbps) why = why.replace('{dl}', downlinkText(p.rbps, contactMinPerDay));
  const link = PART_LINK[p.id];
  if (link) why = why.replace('{m}', `${fmt(linkMarginFor(link, hKm, elevDeg), 1)} dB at ${fmt(hKm, 0)} km, ${fmt(elevDeg, 0)}° elevation`);
  return why;
}

export const PART_INFO: Record<string, { ab: string; why: string }> = {
  obc: { ab: 'OBC', why: 'Main computer: runs the flight software and stores SOS messages until downlink.' },
  adcs: { ab: 'ADC', why: 'Points the satellite using Earth’s magnetic field, to about 10° — enough for UHF, S-band and SOS.' },
  eps: { ab: 'EPS', why: 'Manages power and keeps the satellite alive for about 36 minutes of eclipse each orbit.' },
  bat: { ab: 'BAT', why: 'More stored energy for heavy loads.' },
  uhf: {
    ab: 'UHF',
    why: 'Transmits 1 W, dipole 0 dBi. Link margin to Hòa Lạc {m} — works, but only {dl}.',
  },
  sband: {
    ab: 'S',
    why: 'Transmits 2 W, patch 6 dBi; the station uses a 3 m dish. Link margin {m}; {dl}.',
  },
  sos: { ab: 'SOS', why: 'Receives 300 bps messages from 0.5 W handsets (link margin {m}). Makes 5 MB/day.' },
  sail: { ab: 'SAIL', why: 'Opens 0.5 m² when the mission ends: residual = (L − 3) × 0.047 / 0.547.' },
  shield: { ab: 'SH', why: 'No lost pass from the solar storm (E1-B).' },
};
