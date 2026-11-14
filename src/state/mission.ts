import { useMemo } from 'react';
import { useGameData } from '../data/context';
import { evaluateMission, type MissionResult } from '../sim/mission';
import { useStore } from './store';

/** Memoised SPEC evaluation of the current design + orbit. */
export function useMission(): MissionResult {
  const data = useGameData();
  const { state } = useStore();
  const { difficulty, design, orbit, tutorial } = state;
  return useMemo(
    () =>
      evaluateMission(data, {
        difficulty,
        design,
        orbit: {
          preset: orbit.preset,
          hKm: orbit.hKm,
          planes: orbit.planes,
          perPlane: orbit.perPlane,
          launcher: orbit.launcher,
        },
        orbitChosen: orbit.chosen,
        target: tutorial ? data.scenario.tutorial.target : undefined,
      }),
    [data, difficulty, design, orbit, tutorial],
  );
}
