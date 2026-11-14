// NASA data files (built by data_prep, committed as-is): shape, provenance, and their effect on S1.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { buildOpsContext, evaluateEventOptions, imergWeights, runOps } from '../src/sim/ops';
import { roundTo } from '../src/sim/mission';
import { starsFromVfm } from '../src/sim/score';
import { eventIntro } from '../src/ui/events';
import { accumulate, ictLabel } from '../src/ui/rain';
import { DataProvider } from '../src/data/context';
import { StoreProvider, initialState, reducer, type Action } from '../src/state/store';
import { Brief } from '../src/screens/Brief';
import { Ops } from '../src/screens/Ops';
import type { GameEvent } from '../src/data/types';
import { data, dataNasa, donki, HANOI, imerg } from './fixtures';

describe('imerg_yagi.json (GPM IMERG V07 Final Run)', () => {
  it('carries the source metadata', () => {
    expect(imerg.source).toEqual({
      product: 'GPM_3IMERGHH v07 (Final Run)',
      doi: '10.5067/GPM/IMERG/3B-HH/07',
      catalog: 'https://data.nasa.gov/dataset/gpm-imerg-final-precipitation-l3-half-hourly-0-1-degree-x-0-1-degree-v07-gpm-3imerghh-at-g-fb698',
      host: 'NASA GES DISC',
    });
  });

  it('72 hourly steps from T0 = 2024-09-07 07:00 UTC (14:00 giờ VN)', () => {
    expect(imerg.hours).toHaveLength(72);
    expect(imerg.hours[0]).toBe('2024-09-07T07:00:00Z');
    expect(imerg.hours[71]).toBe('2024-09-10T06:00:00Z');
    expect(ictLabel(imerg.hours[0])).toBe('7 Sep 14:00');
    expect(imerg.hanoi_mmh).toHaveLength(72);
    expect(imerg.box_mean_mmh).toHaveLength(72);
    expect([...imerg.hanoi_mmh, ...imerg.box_mean_mmh].every((x) => Number.isFinite(x) && x >= 0)).toBe(true);
  });

  it('display grid: 72 frames of cols × rows covering 100–112°E, 15–25°N', () => {
    const g = imerg.grid!;
    expect(g.frames).toHaveLength(72);
    expect(g.frames.every((f) => f.length === g.cols * g.rows)).toBe(true);
    expect(g.lon0 - g.step / 2).toBeCloseTo(100, 9);
    expect(g.lat0 - g.step / 2).toBeCloseTo(15, 9);
    expect(g.lon0 + (g.cols - 0.5) * g.step).toBeCloseTo(112, 9);
    expect(g.lat0 + (g.rows - 0.5) * g.step).toBeCloseTo(25, 9);
    expect(Math.max(...accumulate(g))).toBeGreaterThan(0);
  });
});

describe('donki_gst.json (NASA DONKI GST)', () => {
  it('carries a GST record with date, Kp, link and source', () => {
    expect(donki.source).toBe('NASA DONKI (CCMC) · GST');
    expect(donki.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(donki.kpIndex).toBeGreaterThan(0);
    expect(donki.link).toMatch(/^https:\/\/ccmc\.gsfc\.nasa\.gov\/DONKI\//);
  });

  it('E1 card shows the real record (date, Kp)', () => {
    const e1 = data.events.events.find((e) => e.id === 'E1') as GameEvent;
    const text = eventIntro(e1, { hasShield: false, donki });
    expect(text).toContain('Real NASA DONKI record: geomagnetic storm from 10 May 2024 15:00 UTC, Kp 9.');
    expect(eventIntro(e1, { hasShield: false, donki: null })).toContain('not loaded');
  });
});

describe('S1 with real IMERG weights (SPEC §6)', () => {
  const S1 = { preset: 'sso' as const, hKm: 520, planes: 4, perPlane: 1 };
  const ctx = buildOpsContext(S1, HANOI, data.scenario.partnerStation);
  const w = imergWeights(imerg)!;
  const base = { events: [] as GameEvent[], hasShield: false, hourlyWeights: w };
  const r = runOps(ctx, { ...base, choices: {} });

  it('weights w(h) = 1 + R(h)/mean(R) are all > 1 and average 2', () => {
    expect(w).toHaveLength(72);
    expect(Math.min(...w)).toBeGreaterThan(1);
    expect(w.reduce((a, b) => a + b, 0) / 72).toBeCloseTo(2, 9);
  });

  it('P1h_rain = 48,1 % (P1h stays 49,1 %)', () => {
    expect(roundTo(r.p1h, 1)).toBe(49.1);
    expect(roundTo(r.p1hRain, 1)).toBe(48.1);
  });

  it('star 3 stays 4 stars: VFM = 48,1 / 2,64 = 18,2', () => {
    expect(roundTo(roundTo(r.p1hRain, 1) / 2.64, 1)).toBe(18.2);
    expect(starsFromVfm(r.p1hRain / 2.64)).toBe(4);
  });

  it('event option P1h values are unchanged (E1 46/48/48, E2 49/45/48)', () => {
    const ev = (id: string) => data.events.events.find((e) => e.id === id) as GameEvent;
    expect(evaluateEventOptions(ctx, base, ev('E1')).map((o) => o.p1hDisplay)).toEqual([46, 48, 48]);
    expect(evaluateEventOptions(ctx, base, ev('E2')).map((o) => o.p1hDisplay)).toEqual([49, 45, 48]);
  });
});

describe('Brief map uses the real 72 h rain', () => {
  const render = (d: typeof data) =>
    renderToString(
      <DataProvider initial={{ data: d, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
        <StoreProvider initial={{ ...initialState, screen: 'brief' }}>
          <Brief />
        </StoreProvider>
      </DataProvider>,
    ).replace(/<!-- -->/g, '');

  it('with IMERG: label, legend, Hanoi total, no illustrative rain', () => {
    const h = render(dataNasa);
    expect(h).toContain('NASA GPM IMERG V07 Final · 7–10 Sep 2024');
    expect(h).toContain('72 h total rain');
    expect(h).toContain('Hà Nội 197 mm / 72 h');
    expect(h).not.toContain('illustrative');
    expect(h).not.toContain('<ellipse');
  });

  it('without IMERG: says the layer is missing', () => {
    expect(render(data)).toContain('No IMERG rain layer yet');
  });
});

describe('Ops map shows the hourly IMERG layer with the time slider', () => {
  const s = [
    { type: 'startMission' },
    { type: 'acceptContract' },
    {
      type: 'launch',
      record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true },
    },
    { type: 'go', screen: 'ops' },
  ].reduce((st, a) => reducer(st, a as Action), initialState);
  const h = renderToString(
    <DataProvider initial={{ data: dataNasa, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>
        <Ops />
      </StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');

  it('hour 0 = 07/09 14:00 giờ VN, legend, label, rain cells, IMERG weights note', () => {
    expect(h).toContain('Time · hour 0 · 7 Sep 14:00 Vietnam time · Hà Nội rain');
    expect(h).toContain('IMERG rain · 7 Sep 14:00');
    expect(h).toContain('Rain layer: NASA GPM IMERG V07 Final · 7–10 Sep 2024 (DOI 10.5067/GPM/IMERG/3B-HH/07, 0.5° grid)');
    expect(h).toMatch(/<rect[^>]*fill="#3DD6F5" fill-opacity="0\.\d+"/);
    expect(h).toContain('id="ops-time"');
    expect(h).toContain('Rain weight w(h) = 1 + R(h)/R̄');
  });
});
