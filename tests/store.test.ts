import { describe, expect, it } from 'vitest';
import { initialState, reducer, canJump, DEFAULT_DESIGN, type GameState } from '../src/state/store';
import { dealCards, playerForRole } from '../src/state/roles';

const run = (s: GameState, ...actions: Parameters<typeof reducer>[1][]) => actions.reduce(reducer, s);

describe('store reducer', () => {
  it('solo start goes to Brief, co-op to Setup (SPEC §1)', () => {
    expect(run(initialState, { type: 'startMission' }).screen).toBe('brief');
    expect(run(initialState, { type: 'setMode', mode: 'coop' }, { type: 'startMission' }).screen).toBe('setup');
  });

  it('defaults to S1: reference design, SSO 520 4×1 rideshare', () => {
    const s = run(initialState, { type: 'startMission' });
    expect(s.design).toEqual(DEFAULT_DESIGN);
    expect(s.orbit).toMatchObject({ preset: 'sso', hKm: 520, planes: 4, perPlane: 1, launcher: 'rideshare' });
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

  it('tracks distinct configurations once the orbit is chosen (CML3)', () => {
    const s = run(
      initialState,
      { type: 'chooseOrbit' },
      { type: 'setOrbit', patch: { planes: 5 } },
      { type: 'setOrbit', patch: { planes: 5 } },
      { type: 'setChassis', chassis: '12U' },
    );
    expect(s.configs).toEqual(['6U|4|520', '6U|5|520', '12U|5|520']);
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
