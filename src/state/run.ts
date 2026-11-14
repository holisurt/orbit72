// Ops + scoring for the current run, derived from store + data (memoised).
import { useMemo } from 'react';
import { useGameData } from '../data/context';
import type { GameData, GameEvent } from '../data/types';
import type { MissionResult } from '../sim/mission';
import {
  buildOpsContext,
  cloudModel,
  evaluateEventOptions,
  imagingPasses,
  imergWeights,
  runOps,
  type OpsConfig,
  type OpsContext,
  type OpsResult,
  type OptionOutcome,
} from '../sim/ops';
import {
  cmlLevel,
  computeScore,
  priorityCards,
  whyChain,
  type CardResult,
  type EventDecision,
  type ScoreResult,
  type WhyItem,
} from '../sim/score';
import { useMission } from './mission';
import { useStore, type GameState } from './store';

/** E3 cloud window: from the event to the end of the 72 h [GA — SPEC §6 gives no end time]. */
export const E3_WINDOW: [number, number] = [50, 72];

export function activeEvents(data: GameData, s: GameState): GameEvent[] {
  const ids = data.scenario.difficulty[s.difficulty].events;
  return data.events.events.filter((e) => {
    if (!ids.includes(e.id)) return false;
    if (e.onlyIf === 'noEnvTest') return !s.design.envTest;
    if (e.onlyIf === 'giam_doc') return s.difficulty === 'giam_doc';
    return true;
  });
}

export interface RunView {
  mission: MissionResult;
  ctx: OpsContext;
  events: GameEvent[];
  base: Omit<OpsConfig, 'choices'>;
  ops: OpsResult; // with current choices
  nominal: OpsResult; // no events (launch losses still apply)
  options: Record<string, OptionOutcome[]>;
  hasShield: boolean;
  hasProp: boolean;
  weightsSource: 'imerg' | 'none';
  imaging: ReturnType<typeof imagingPasses>;
  cards: CardResult[] | undefined;
  decisions: EventDecision[];
  score: ScoreResult;
  why: WhyItem[];
  cml: 0 | 1 | 2 | 3 | 4;
  totalCostKusd: number; // nominal + launch replacements + event costs
}

export function useRun(): RunView {
  const data = useGameData();
  const { state } = useStore();
  const mission = useMission();
  const o = mission.orbit;

  const ctx = useMemo(
    () =>
      buildOpsContext(
        { preset: o.preset, hKm: o.hKm, planes: o.planes, perPlane: o.perPlane },
        data.scenario.target,
        data.scenario.partnerStation,
      ),
    [data, o.preset, o.hKm, o.planes, o.perPlane],
  );

  const { difficulty } = state;
  const envTest = state.design.envTest;
  const events = useMemo(
    () => activeEvents(data, { ...state, difficulty, design: { ...state.design, envTest } }),
    // only difficulty and env test decide which events are active
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, difficulty, envTest],
  );
  const hasShield = mission.build.parts.some((p) => p.e1Immune);
  const hasProp = mission.build.parts.some((p) => p.enablesE4A);
  const weights = useMemo(() => imergWeights(data.imerg), [data.imerg]);
  const launch = state.ops.launch;
  const noSatellites = mission.reqs.find((r) => r.id === 'R6')!.status === 'VUOT';

  const base = useMemo<Omit<OpsConfig, 'choices'>>(
    () => ({ events, hasShield, lostPlanes: launch?.lostPlanes ?? [], noSatellites, hourlyWeights: weights }),
    [events, hasShield, launch, noSatellites, weights],
  );

  const ops = useMemo(() => runOps(ctx, { ...base, choices: state.ops.choices }), [ctx, base, state.ops.choices]);
  const nominal = useMemo(() => runOps(ctx, { ...base, events: [], choices: {} }), [ctx, base]);

  const options = useMemo(() => {
    const out: Record<string, OptionOutcome[]> = {};
    for (const ev of events)
      out[ev.id] = evaluateEventOptions(ctx, base, ev, (k) => {
        const req = ev.options.find((x) => x.k === k)?.requires;
        return !req || mission.build.parts.some((p) => p.id === req);
      });
    return out;
  }, [ctx, base, events, mission.build.parts]);

  return useMemo(() => {
    const cam = mission.build.parts.some((p) => p.id === 'cam');
    const precise = mission.build.parts.some((p) => p.id === 'adcs2');
    const e3 = events.find((e) => e.id === 'E3');
    const e3Choice = e3 ? state.ops.choices.E3 : undefined;
    const e3Fraction = e3Choice ? Number(e3?.options.find((x) => x.k === e3Choice)?.effect.imagingFraction ?? 0) : 0;
    const imaging = imagingPasses(
      ops,
      cam && precise,
      cloudModel(data.imerg, data.scenario.cloudRainThresholdMmH, e3 ? E3_WINDOW : null),
      e3 ? { window: E3_WINDOW, fraction: e3Fraction } : null,
    );
    const cards = state.mode === 'coop' && state.players.cards ? priorityCards(state.players.cards, mission) : undefined;
    const decisions: EventDecision[] = events
      .filter((ev) => state.ops.choices[ev.id])
      .map((ev) => ({ event: ev, chosen: state.ops.choices[ev.id], outcomes: options[ev.id] }));
    const prev = state.runs.filter((r) => r.run < state.run).at(-1)?.overall ?? null;
    const score = computeScore({
      mission,
      inOrbit: launch?.inOrbit ?? true,
      p1hRainOps: ops.p1hRain,
      p1hRainNominal: nominal.p1hRain,
      imaging,
      launchedWithVuot: launch?.launchedWithVuot ?? false,
      launchedWithNoGo: launch?.launchedWithNoGo ?? false,
      decisions,
      decisionPenalty: ops.decisionPenalty,
      prevOverall: prev,
      mode: state.mode,
      cards,
      unanimousGo: launch?.unanimousGo ?? false,
    });
    const r5 = mission.reqs.find((r) => r.id === 'R5')!.status;
    const r8 = mission.reqs.find((r) => r.id === 'R8')!.status;
    const cml = cmlLevel({
      contractAccepted: state.contract.accepted,
      hardOk: r5 !== 'VUOT' && r8 !== 'VUOT',
      configsCompared: state.configs.length,
      reruns: state.run - 1,
      launched: !!launch,
      allPassed: score.passed === 8,
      specExported: state.specExported,
    });
    return {
      mission,
      ctx,
      events,
      base,
      ops,
      nominal,
      options,
      hasShield,
      hasProp,
      weightsSource: weights ? 'imerg' : 'none',
      imaging,
      cards,
      decisions,
      score,
      why: whyChain(mission, decisions),
      cml,
      totalCostKusd: mission.totalCostKusd + (launch?.extraCostKusd ?? 0) + ops.eventCostKusd,
    };
  }, [mission, ctx, events, base, ops, nominal, options, hasShield, hasProp, weights, state, data, launch]);
}
