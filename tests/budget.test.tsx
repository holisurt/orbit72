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

const s1 = (extraCostKusd: number): GameState =>
  [
    { type: 'startMission' },
    { type: 'acceptContract' },
    { type: 'removePart', index: 3 },
    { type: 'addPart', id: 'sband' },
    { type: 'chooseOrbit' },
    { type: 'launch', record: { attempts: [], lostPlanes: [], extraCostKusd, extraMonths: 0, inOrbit: true, launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
  ].reduce((s, a) => reducer(s, a as Action), initialState);

describe('E2-A generator (20k) vs remaining budget', () => {
  it('S1 (2.640k of 3.000k → 360k left): E2-A available and best', () => {
    const r = probe(s1(0));
    expect(r.blocked).toEqual({});
    expect(r.e2).toEqual([
      { k: 'A', ok: true, rank: 'best' },
      { k: 'B', ok: true, rank: 'worst' },
      { k: 'C', ok: true, rank: 'middle' },
    ]);
  });

  it('after a 350k replacement launch (10k left): E2-A disabled with the reason', () => {
    const r = probe(s1(350));
    expect(r.blocked).toEqual({ A: 'Không đủ ngân sách: còn 10k' });
    expect(r.e2[0]).toMatchObject({ k: 'A', ok: false });
    expect(r.e2.filter((o: { ok: boolean }) => o.ok).map((o: { k: string }) => o.k)).toEqual(['B', 'C']);
  });

  it('exactly enough budget (20k left) keeps E2-A available', () => {
    expect(probe(s1(340)).blocked).toEqual({});
  });
});
