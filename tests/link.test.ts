import { describe, expect, it } from 'vitest';
import { LINKS, downlinkBytesPerDay, fsplDb, linkMarginDb } from '../src/sim/link';
import { near } from './fixtures';

describe('link (SPEC §10)', () => {
  it('FSPL(1744 km, 437 MHz) = 150.1 dB', () => expect(near(fsplDb(1744, 437), 150.1)).toBe(true));
  it('FSPL(1744 km, 2200 MHz) = 164.1 dB', () => expect(near(fsplDb(1744, 2200), 164.1)).toBe(true));

  it.each([
    ['uhf', 9.7, 20.2],
    ['s', 8.4, 18.9],
    ['sos', 9.3, 19.8],
  ] as const)('%s margin @520: 10° = %f, 90° = %f dB', (id, m10, m90) => {
    expect(linkMarginDb(LINKS[id], 520, 10)).toBeCloseTo(m10, 1);
    expect(linkMarginDb(LINKS[id], 520, 90)).toBeCloseTo(m90, 1);
  });

  it('downlink @17 min: UHF 1.22 MB, S 255 MB', () => {
    expect(near(downlinkBytesPerDay(9600, 17) / 1e6, 1.22)).toBe(true);
    expect(near(downlinkBytesPerDay(2e6, 17) / 1e6, 255)).toBe(true);
  });
});
