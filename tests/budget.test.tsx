// GDD §12 #6: event options that cost money are disabled when the remaining budget is smaller than the cost.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DataProvider } from '../src/data/context';
import { useRun } from '../src/state/run';
import { initialState, reducer, StoreProvider, type Action, type GameState } from '../src/state/store';
import { data } from './fixtures';

function Probe() {
  const run = useRun();
  const e2 = run.options.E2.map((o) => ({ k: o.key, ok: o.available, rank: o.rank }));
  return <pre>{JSON.stringify({ blocked: run.blocked.E2 ?? {}, e2 })}</pre>;
}

const probe = (s: GameState) =>
  JSON.parse(
    renderToString(
      <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
        <StoreProvider initial={s}>
          <Probe />
        </StoreProvider>
      </DataProvider>,
    )
      .replace(/^<pre>|<\/pre>$/g, '')
      .replace(/&quot;/g, '"'),
  );

// S1 (UHF → S-band) plus optional extras that push the design cost toward the 3.000k budget.
const s1 = (...extra: Action[]): GameState =>
  [
    { type: 'startMission' },
    { type: 'acceptContract' },
    { type: 'removePart', index: 3 },
    { type: 'addPart', id: 'sband' },
    ...extra,
    { type: 'chooseOrbit' },
    { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
  ].reduce((s, a) => reducer(s, a as Action), initialState);

describe('E2-A generator (20k) vs remaining budget', () => {
  it('S1 (2.640k of 3.000k → 360k left): E2-A available and best', () => {
    const r = probe(s1());
    expect(r.blocked).toEqual({});
    expect(r.e2).toEqual([
      { k: 'A', ok: true, rank: 'best' },
      { k: 'B', ok: true, rank: 'worst' },
      { k: 'C', ok: true, rank: 'middle' },
    ]);
  });

  it('wings + env test (+90k × 4 → 3.000k, 0k left): E2-A disabled with the reason', () => {
    const r = probe(s1({ type: 'toggleWings' }, { type: 'toggleEnvTest' }));
    expect(r.blocked).toEqual({ A: 'Not enough budget: 0k left' });
    expect(r.e2[0]).toMatchObject({ k: 'A', ok: false });
    expect(r.e2.filter((o: { ok: boolean }) => o.ok).map((o: { k: string }) => o.k)).toEqual(['B', 'C']);
  });

  it('exactly enough budget (battery + sail + shield + env test → 2.980k, 20k left) keeps E2-A available', () => {
    const add = (id: string): Action => ({ type: 'addPart', id });
    expect(probe(s1(add('bat'), add('sail'), add('shield'), { type: 'toggleEnvTest' })).blocked).toEqual({});
  });
});
