import { describe, expect, it } from 'vitest';
import { initialState, reducer, canJump, loadState, DEFAULT_DESIGN, type GameState } from '../src/state/store';
import { dealCards, playerForRole } from '../src/state/roles';

function localStorageMock(value: string | null) {
  (globalThis as unknown as { localStorage: Pick<Storage, 'getItem'> }).localStorage = { getItem: () => value };
}

const run = (s: GameState, ...actions: Parameters<typeof reducer>[1][]) => actions.reduce(reducer, s);

describe('store reducer', () => {
  it('solo start goes to Brief, co-op to Setup (SPEC §1)', () => {
    expect(run(initialState, { type: 'startMission' }).screen).toBe('brief');
    expect(run(initialState, { type: 'setMode', mode: 'coop' }, { type: 'startMission' }).screen).toBe('setup');
  });

  it('fresh default: HF-Build design (UHF, no S-band) and S1 orbit SSO 520 4×1 rideshare', () => {
    const s = run(initialState, { type: 'startMission' });
    expect(s.design).toEqual(DEFAULT_DESIGN);
    expect(s.design.parts).toEqual(['obc', 'eps', 'adcs', 'uhf', 'sos']);
    expect(s.orbit).toMatchObject({ preset: 'sso', hKm: 520, planes: 4, perPlane: 1, launcher: 'rideshare' });
  });

  it('a saved game keeps its own design', () => {
    const saved = { ...initialState, design: { ...DEFAULT_DESIGN, parts: ['obc', 'eps', 'adcs', 'sband', 'sos'] } };
    localStorageMock(JSON.stringify(saved));
    expect(loadState().design.parts).toContain('sband');
  });

  it('ISS preset forces P = 1, h = 400', () => {
    const s = run(initialState, { type: 'setOrbit', patch: { preset: 'iss', planes: 4, hKm: 550 } });
    expect(s.orbit).toMatchObject({ planes: 1, hKm: 400 });
  });

  it('clamps P 1–6, k 1–3, h 300–800', () => {
    const s = run(initialState, { type: 'setOrbit', patch: { planes: 9, perPlane: 0, hKm: 900 } });
    expect(s.orbit).toMatchObject({ planes: 6, perPlane: 1, hKm: 800 });
  });

  it('adds and removes parts by index (duplicates allowed)', () => {
    const s = run(initialState, { type: 'addPart', id: 'bat' }, { type: 'addPart', id: 'bat' }, { type: 'removePart', index: 0 });
    expect(s.design.parts.filter((p) => p === 'bat')).toHaveLength(2);
    expect(s.design.parts[0]).toBe('eps');
  });

  it('counts design decisions changed with the HUD visible (CML3)', () => {
    const s = run(
      initialState,
      { type: 'chooseOrbit' }, // opening the Orbit screen is not a decision
      { type: 'setOrbit', patch: { planes: 5 } },
      { type: 'setOrbit', patch: { planes: 5 } }, // no change
      { type: 'setOrbit', patch: { launcher: 'dedicated' } }, // launcher is not in the CML3 list
      { type: 'setChassis', chassis: '6U' }, // same chassis
      { type: 'setChassis', chassis: '12U' },
      { type: 'setOrbit', patch: { perPlane: 2 } },
      { type: 'setOrbit', patch: { preset: 'leo53' } },
      { type: 'removePart', index: 3 },
      { type: 'addPart', id: 'sband' },
      { type: 'toggleWings' }, // not in the list
    );
    expect(s.designChanges).toBe(6);
  });

  it('stepper jumps only among Brief/Build/Orbit', () => {
    expect(canJump('build', 'orbit')).toBe(true);
    expect(canJump('orbit', 'review')).toBe(false);
  });

  it('tutorial starts on Build with coach and UHF design', () => {
    const s = run(initialState, { type: 'startTutorial' });
    expect(s.screen).toBe('build');
    expect(s.coach.open).toBe(true);
    expect(s.design.parts).toContain('uhf');
  });
});

describe('roles (SPEC §8)', () => {
  it('maps roles to players for 4/3/2 players', () => {
    expect(playerForRole(4, 'QD')).toBe(3);
    expect(playerForRole(3, 'KH')).toBe(1);
    expect(playerForRole(2, 'QD')).toBe(0);
  });
  it('deals a or b per role', () => {
    const c = dealCards(() => 0.9);
    expect(Object.values(c)).toEqual(['b', 'b', 'b', 'b']);
  });
});
