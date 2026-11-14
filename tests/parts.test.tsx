// CP4.4 Part detail cards: link margins come from the current altitude, same function as the Orbit R7 panel.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider } from '../src/state/store';
import { linkMarginFor } from '../src/sim/link';
import { PART_INFO, partWhy } from '../src/ui/parts';
import { fmt } from '../src/ui/format';
import { Orbit } from '../src/screens/Orbit';
import { data } from './fixtures';

const part = (id: string) => data.components.parts.find((p) => p.id === id)!;
const EPS = data.scenario.requirements.elevationDeg;

describe('part card link margins', () => {
  it('no fixed margin text left in the card copy', () => {
    for (const [id, info] of Object.entries(PART_INFO)) expect(info.why, id).not.toMatch(/\d+,\d+ dB/);
  });

  it('520 km reproduces SPEC §10: UHF 9,7 · S 8,4 · SOS 9,3 dB', () => {
    expect(partWhy(part('uhf'), 17, 520, EPS)).toContain('Link margin to Hòa Lạc 9.7 dB at 520 km, 10° elevation');
    expect(partWhy(part('sband'), 17, 520, EPS)).toContain('Link margin 8.4 dB at 520 km');
    expect(partWhy(part('sos'), 17, 520, EPS)).toContain('link margin 9.3 dB at 520 km');
  });

  it.each([400, 480, 600, 800])('follows the altitude (%i km)', (h) => {
    for (const [id, link] of [['uhf', 'uhf'], ['sband', 's'], ['sos', 'sos']] as const)
      expect(partWhy(part(id), 17, h, EPS)).toContain(`${fmt(linkMarginFor(link, h, EPS), 1)} dB at ${h} km`);
    expect(linkMarginFor('uhf', h, EPS)).not.toBeCloseTo(linkMarginFor('uhf', 520, EPS), 1);
  });

  it('matches the number the Orbit screen shows at the same altitude', () => {
    const s = reducer(reducer(reducer(initialState, { type: 'startMission' }), { type: 'acceptContract' }), { type: 'setOrbit', patch: { hKm: 600 } });
    const h = renderToString(
      <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
        <StoreProvider initial={s}>
          <Orbit />
        </StoreProvider>
      </DataProvider>,
    );
    const uhf = fmt(linkMarginFor('uhf', 600, EPS), 1);
    expect(h).toContain(uhf);
    expect(partWhy(part('uhf'), 17, 600, EPS)).toContain(`${uhf} dB at 600 km`);
  });
});
