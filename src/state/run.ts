// Ops + scoring for the current run, derived from store + data (memoised).
import { useMemo } from 'react';
import { useGameData } from '../data/context';
import type { GameData, GameEvent } from '../data/types';
import type { MissionResult } from '../sim/mission';
import {
  buildOpsContext,
  evaluateEventOptions,
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
import { fmt } from '../ui/format';
import { useStore, type GameState } from './store';

export function activeEvents(data: GameData, s: GameState): GameEvent[] {
  const ids = data.scenario.difficulty[s.difficulty].events;
  return data.events.events.filter((e) => {
    if (!ids.includes(e.id)) return false;
    if (e.onlyIf === 'noEnvTest') return !s.design.envTest;
    return true;
  });
}

export interface RunView {
  mission: MissionResult;
  ctx: OpsContext;
  events: GameEvent[];
  base: Omit<OpsConfig, 'choices'>;
  ops: OpsResult; // with current choices
  nominal: OpsResult; // no events
  options: Record<string, OptionOutcome[]>;
  /** event id → option key → reason it is disabled (not enough budget). */
  blocked: Record<string, Record<string, string>>;
  hasShield: boolean;
  weightsSource: 'imerg' | 'none';
  cards: CardResult[] | undefined;
  decisions: EventDecision[];
  score: ScoreResult;
  why: WhyItem[];
  cml: 0 | 1 | 2 | 3 | 4;
  /** Level the player holds once the spec sheet is exported — printed on the exported PNG itself. */
  cmlOnExport: 0 | 1 | 2 | 3 | 4;
  totalCostKusd: number; // nominal design cost + event costs
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
  const weights = useMemo(() => imergWeights(data.imerg), [data.imerg]);
  const launch = state.ops.launch;
  const noSatellites = mission.reqs.find((r) => r.id === 'R6')!.status === 'VUOT';

  const base = useMemo<Omit<OpsConfig, 'choices'>>(
    () => ({ events, hasShield, noSatellites, hourlyWeights: weights }),
    [events, hasShield, noSatellites, weights],
  );

  const ops = useMemo(() => runOps(ctx, { ...base, choices: state.ops.choices }), [ctx, base, state.ops.choices]);
  const nominal = useMemo(() => runOps(ctx, { ...base, events: [], choices: {} }), [ctx, base]);

  // Why an option cannot be chosen (GDD §12 #6): its cost exceeds the remaining budget
  // (budget − nominal design cost − costs of the other events already chosen).
  const blocked = useMemo(() => {
    const out: Record<string, Record<string, string>> = {};
    for (const ev of events) {
      const otherCosts = events
        .filter((e) => e.id !== ev.id && state.ops.choices[e.id])
        .reduce((sum, e) => sum + Number(e.options.find((o) => o.k === state.ops.choices[e.id])?.effect.costKusd ?? 0), 0);
      const remaining = mission.budgetKusd - mission.totalCostKusd - otherCosts;
      out[ev.id] = {};
      for (const o of ev.options) {
        const cost = Number(o.effect.costKusd ?? 0);
        if (cost > 0 && cost > remaining) out[ev.id][o.k] = `Không đủ ngân sách: còn ${fmt(Math.max(0, remaining), 0)}k`;
      }
    }
    return out;
  }, [events, state.ops.choices, mission.budgetKusd, mission.totalCostKusd]);

  const options = useMemo(() => {
    const out: Record<string, OptionOutcome[]> = {};
    for (const ev of events) out[ev.id] = evaluateEventOptions(ctx, base, ev, (k) => !blocked[ev.id]?.[k]);
    return out;
  }, [ctx, base, events, blocked]);

  return useMemo(() => {
    const cards = state.mode === 'coop' && state.players.cards ? priorityCards(state.players.cards, mission) : undefined;
    const decisions: EventDecision[] = events
      .filter((ev) => state.ops.choices[ev.id])
      .map((ev) => ({ event: ev, chosen: state.ops.choices[ev.id], outcomes: options[ev.id] }));
    const prev = state.runs.filter((r) => r.run < state.run).at(-1)?.overall ?? null;
    const score = computeScore({
      mission,
      p1hRainOps: ops.p1hRain,
      p1hRainNominal: nominal.p1hRain,
      launchedWithVuot: launch?.launchedWithVuot ?? false,
      launchedWithNoGo: launch?.launchedWithNoGo ?? false,
      decisions,
      prevOverall: prev,
      mode: state.mode,
      cards,
      unanimousGo: launch?.unanimousGo ?? false,
    });
    const r5 = mission.reqs.find((r) => r.id === 'R5')!.status;
    const r8 = mission.reqs.find((r) => r.id === 'R8')!.status;
    const cmlInput = {
      contractAccepted: state.contract.accepted,
      hardOk: r5 !== 'VUOT' && r8 !== 'VUOT',
      designChanges: state.designChanges,
      reruns: state.run - 1,
      launched: !!launch,
      allPassed: score.passed === 8,
      specExported: state.specExported,
    };
    const cml = cmlLevel(cmlInput);
    const cmlOnExport = cmlLevel({ ...cmlInput, specExported: true });
    return {
      mission,
      ctx,
      events,
      base,
      ops,
      nominal,
      options,
      blocked,
      hasShield,
      weightsSource: weights ? 'imerg' : 'none',
      cards,
      decisions,
      score,
      why: whyChain(mission, decisions),
      cml,
      cmlOnExport,
      totalCostKusd: mission.totalCostKusd + ops.eventCostKusd,
    };
  }, [mission, ctx, events, base, ops, nominal, options, blocked, hasShield, weights, state, launch]);
}
