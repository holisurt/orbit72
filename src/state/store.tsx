// Game state: useReducer + context, autosaved to localStorage (key orbit72.v1) on every change.
// Reload resumes at the start of the last screen.
import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { ChassisId, DifficultyId, LauncherId } from '../data/types';
import type { DesignInput } from '../sim/build';
import type { PresetId } from '../sim/coverage';

export const STORAGE_KEY = 'orbit72.v1';

export type ScreenId =
  | 'home'
  | 'setup'
  | 'quiz_pre'
  | 'brief'
  | 'build'
  | 'orbit'
  | 'review'
  | 'launch'
  | 'ops'
  | 'debrief'
  | 'quiz_post'
  | 'share'
  | 'guide';

export type Mode = 'solo' | 'coop';
export type RoleId = 'FD' | 'VT' | 'KH' | 'QD';
export type CardSide = 'a' | 'b';
export type PlayerCount = 2 | 3 | 4;
export type ContractId = 'golden72' | 'matbien';

export interface OrbitState {
  preset: PresetId;
  hKm: number;
  planes: number;
  perPlane: number;
  launcher: LauncherId;
  chosen: boolean; // true once the Orbit screen has been opened
}

export interface RunRecord {
  run: number;
  design: DesignInput;
  orbit: OrbitState;
  overall?: number;
}

export type Vote = 'go' | 'no' | null;
export type QuizAnswers = number[] | 'skip' | null;
export type QuizPhase = 'pre' | 'post';
export type RCode = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8';

/** Result of the Go/No-Go launch (launches always succeed since v1.1). */
export interface LaunchRecord {
  launchedWithVuot: boolean;
  launchedWithNoGo: boolean;
  unanimousGo: boolean;
}

export interface OpsState {
  votes: Record<RoleId, Vote>;
  reasons: Partial<Record<RoleId, RCode>>; // NO-GO requires a reason (SPEC §8)
  launch: LaunchRecord | null;
  choices: Record<string, string>; // event id → option
  clockMin: number; // ops clock, resumes on reload
  done: boolean;
}

export const EMPTY_OPS: OpsState = {
  votes: { FD: null, VT: null, KH: null, QD: null },
  reasons: {},
  launch: null,
  choices: {},
  clockMin: 0,
  done: false,
};

export interface GameState {
  v: 1;
  screen: ScreenId;
  returnTo: ScreenId | null; // for Guide / overlays
  guideTab: number; // tab the Guide opens on (0 Thuật ngữ … 4 Nguồn)
  guideFocus: string | null; // Guide card title to scroll to (from a "?" term explainer)
  mode: Mode;
  difficulty: DifficultyId;
  tutorial: boolean;
  players: { count: PlayerCount; names: string[]; cards: Record<RoleId, CardSide> | null };
  contract: { id: ContractId; accepted: boolean };
  design: DesignInput;
  orbit: OrbitState;
  ops: OpsState;
  runs: RunRecord[];
  run: number;
  /** Quiz answers (option index per question), 'skip' if skipped, null if not reached yet. No personal data. */
  quiz: { pre: QuizAnswers; post: QuizAnswers };
  /** Screen to open after the post quiz (Share from the Debrief CTA, Debrief from its quiz row). */
  quizNext: ScreenId | null;
  coach: { open: boolean };
  /**
   * Design decisions changed on Build/Orbit, where the HUD shows each effect live (part swap/add/remove,
   * chassis, altitude, inclination preset, planes, satellites per plane) — for the CML3 badge (SPEC §12).
   */
  designChanges: number;
  specExported: boolean;
}

/**
 * Fresh starting design (design/HF-Build): OBC, EPS, ADCS basic, UHF, SOS — no S-band, so the
 * Data bar starts VƯỢT and the tutorial step "add S-band" applies. Saved games keep their own design.
 */
export const DEFAULT_DESIGN: DesignInput = {
  chassis: '6U',
  parts: ['obc', 'eps', 'adcs', 'uhf', 'sos'],
  wings: false,
  envTest: false,
};

/** Default S1: SSO 520 km, 4×1, rideshare. */
export const DEFAULT_ORBIT: OrbitState = {
  preset: 'sso',
  hKm: 520,
  planes: 4,
  perPlane: 1,
  launcher: 'rideshare',
  chosen: false,
};

export const initialState: GameState = {
  v: 1,
  screen: 'home',
  returnTo: null,
  guideTab: 0,
  guideFocus: null,
  mode: 'solo',
  difficulty: 'ky_su',
  tutorial: false,
  players: { count: 4, names: ['', '', '', ''], cards: null },
  contract: { id: 'golden72', accepted: false },
  design: DEFAULT_DESIGN,
  orbit: DEFAULT_ORBIT,
  ops: EMPTY_OPS,
  runs: [],
  run: 1,
  quiz: { pre: null, post: null },
  quizNext: null,
  coach: { open: false },
  designChanges: 0,
  specExported: false,
};

export type Action =
  | { type: 'go'; screen: ScreenId }
  | { type: 'openGuide'; tab?: number; focus?: string }
  | { type: 'closeGuide' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setDifficulty'; difficulty: DifficultyId }
  | { type: 'startMission' }
  | { type: 'answerQuiz'; phase: QuizPhase; answers: number[] | 'skip' }
  | { type: 'openPostQuiz'; next: ScreenId }
  | { type: 'startTutorial' }
  | { type: 'startSandbox' }
  | { type: 'setPlayerCount'; count: PlayerCount }
  | { type: 'setPlayerName'; index: number; name: string }
  | { type: 'dealCards'; cards: Record<RoleId, CardSide> }
  | { type: 'acceptContract' }
  | { type: 'setChassis'; chassis: ChassisId }
  | { type: 'addPart'; id: string }
  | { type: 'removePart'; index: number }
  | { type: 'toggleWings' }
  | { type: 'toggleEnvTest' }
  | { type: 'setCoach'; open: boolean }
  | { type: 'setOrbit'; patch: Partial<OrbitState> }
  | { type: 'chooseOrbit' }
  | { type: 'vote'; role: RoleId; vote: Vote }
  | { type: 'reason'; role: RoleId; code: RCode }
  | { type: 'launch'; record: LaunchRecord }
  | { type: 'chooseEvent'; id: string; key: string }
  | { type: 'setClock'; min: number }
  | { type: 'finishOps' }
  | { type: 'recordRun'; overall: number }
  | { type: 'rerun' }
  | { type: 'exportSpec' }
  | { type: 'reset' };

const ORDER_BEFORE_LAUNCH: ScreenId[] = ['brief', 'build', 'orbit'];

const changed = (s: GameState): GameState => ({ ...s, designChanges: s.designChanges + 1 });
const ORBIT_DECISIONS = ['preset', 'hKm', 'planes', 'perPlane'] as const;

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'go':
      return { ...s, screen: a.screen };
    case 'openGuide':
      if (s.screen === 'guide') return { ...s, guideTab: a.tab ?? s.guideTab, guideFocus: a.focus ?? null };
      return { ...s, returnTo: s.screen, screen: 'guide', guideTab: a.tab ?? 0, guideFocus: a.focus ?? null };
    case 'closeGuide':
      return { ...s, screen: s.returnTo ?? 'home', returnTo: null };
    case 'setMode':
      return { ...s, mode: a.mode };
    case 'setDifficulty':
      return { ...s, difficulty: a.difficulty };
    case 'startMission':
      return {
        ...initialState,
        mode: s.mode,
        difficulty: s.difficulty,
        players: s.players,
        // Flow (SPEC §1): Home → Setup (co-op) → Quiz(pre) → Brief; a new mission starts a new pre/post pair.
        screen: s.mode === 'coop' ? 'setup' : 'quiz_pre',
      };
    case 'answerQuiz':
      if (a.phase === 'pre') return { ...s, quiz: { ...s.quiz, pre: a.answers }, screen: 'brief' };
      return { ...s, quiz: { ...s.quiz, post: a.answers }, screen: s.quizNext ?? 'share', quizNext: null };
    case 'openPostQuiz':
      return { ...s, quizNext: a.next, screen: 'quiz_post' };
    case 'startTutorial':
      return {
        ...initialState,
        mode: 'solo',
        difficulty: 'hoc_vien',
        tutorial: true,
        contract: { id: 'matbien', accepted: true },
        design: DEFAULT_DESIGN,
        coach: { open: true },
        screen: 'build',
      };
    case 'startSandbox':
      return {
        ...initialState,
        mode: s.mode,
        difficulty: s.difficulty,
        contract: { id: 'golden72', accepted: true },
        screen: 'orbit',
      };
    case 'setPlayerCount':
      return { ...s, players: { ...s.players, count: a.count, cards: null } };
    case 'setPlayerName': {
      const names = s.players.names.slice();
      names[a.index] = a.name.slice(0, 24);
      return { ...s, players: { ...s.players, names } };
    }
    case 'dealCards':
      return { ...s, players: { ...s.players, cards: a.cards } };
    case 'acceptContract':
      return { ...s, contract: { ...s.contract, accepted: true }, screen: 'build' };
    case 'setChassis':
      return a.chassis === s.design.chassis ? s : changed({ ...s, design: { ...s.design, chassis: a.chassis } });
    case 'addPart':
      return changed({ ...s, design: { ...s.design, parts: [...s.design.parts, a.id] } });
    case 'removePart':
      if (a.index < 0 || a.index >= s.design.parts.length) return s;
      return changed({ ...s, design: { ...s.design, parts: s.design.parts.filter((_, i) => i !== a.index) } });
    case 'toggleWings':
      return { ...s, design: { ...s.design, wings: !s.design.wings } };
    case 'toggleEnvTest':
      return { ...s, design: { ...s.design, envTest: !s.design.envTest } };
    case 'setCoach':
      return { ...s, coach: { open: a.open } };
    case 'setOrbit': {
      const orbit = { ...s.orbit, ...a.patch };
      if (orbit.preset === 'iss') {
        orbit.hKm = 400;
        orbit.planes = 1;
      }
      orbit.planes = clamp(orbit.planes, 1, 6);
      orbit.perPlane = clamp(orbit.perPlane, 1, 3);
      orbit.hKm = clamp(orbit.hKm, 300, 800);
      const next = { ...s, orbit };
      return ORBIT_DECISIONS.some((k) => orbit[k] !== s.orbit[k]) ? changed(next) : next;
    }
    case 'chooseOrbit':
      return { ...s, orbit: { ...s.orbit, chosen: true } };
    case 'vote': {
      const reasons = { ...s.ops.reasons };
      if (a.vote !== 'no') delete reasons[a.role];
      return { ...s, ops: { ...s.ops, votes: { ...s.ops.votes, [a.role]: a.vote }, reasons } };
    }
    case 'reason':
      return { ...s, ops: { ...s.ops, reasons: { ...s.ops.reasons, [a.role]: a.code } } };
    case 'launch':
      return { ...s, ops: { ...s.ops, launch: a.record, choices: {}, clockMin: 0, done: false }, screen: 'launch' };
    case 'chooseEvent':
      return { ...s, ops: { ...s.ops, choices: { ...s.ops.choices, [a.id]: a.key } } };
    case 'setClock':
      return { ...s, ops: { ...s.ops, clockMin: a.min } };
    case 'finishOps':
      return { ...s, ops: { ...s.ops, done: true, clockMin: 72 * 60 }, screen: 'debrief' };
    case 'recordRun':
      if (s.runs.some((r) => r.run === s.run)) return s;
      return { ...s, runs: [...s.runs, { run: s.run, design: s.design, orbit: s.orbit, overall: a.overall }] };
    case 'rerun':
      // "Sửa & chạy lại": Debrief → Build, keeps design + orbit, resets ops/events, run++ (SPEC §1)
      return { ...s, ops: EMPTY_OPS, run: s.run + 1, specExported: false, screen: 'build' };
    case 'exportSpec':
      return { ...s, specExported: true };
    case 'reset':
      return initialState;
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** Screens the stepper may jump between before launch. */
export function canJump(from: ScreenId, to: ScreenId): boolean {
  return ORDER_BEFORE_LAUNCH.includes(from) && ORDER_BEFORE_LAUNCH.includes(to);
}

const SCREENS: ScreenId[] = ['home', 'setup', 'quiz_pre', 'brief', 'build', 'orbit', 'review', 'launch', 'ops', 'debrief', 'quiz_post', 'share', 'guide'];
/** Parts and events removed in v1.1 — dropped from older saves. */
const REMOVED_PARTS = ['obc2', 'adcs2', 'xband', 'ais', 'cam', 'prop'];
const REMOVED_EVENTS = ['E3', 'E4'];
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isAnswers = (x: unknown) => x === null || x === 'skip' || (Array.isArray(x) && x.every((n) => Number.isInteger(n)));

/**
 * Validate a saved game. Anything malformed → a fresh game (never a crash); older v1.0 saves are migrated
 * (Giám đốc → Kỹ sư, removed parts/events dropped, launch record reduced to the vote outcome).
 */
export function sanitizeState(parsed: unknown): GameState {
  if (!isObj(parsed) || parsed.v !== 1) return initialState;
  const p = parsed as Partial<GameState>;
  const d = p.design as Partial<DesignInput> | undefined;
  const o = p.orbit as Partial<OrbitState> | undefined;
  const ops = isObj(p.ops) ? (p.ops as Partial<OpsState>) : {};
  const valid =
    SCREENS.includes(p.screen as ScreenId) &&
    (p.mode === undefined || p.mode === 'solo' || p.mode === 'coop') &&
    isObj(d) && ['3U', '6U', '12U'].includes(d.chassis as string) && Array.isArray(d.parts) && d.parts.every((x) => typeof x === 'string') &&
    isObj(o) && ['sso', 'iss', 'low20', 'leo53'].includes(o.preset as string) && ['rideshare', 'iss', 'dedicated'].includes(o.launcher as string) &&
    isNum(o.hKm) && isNum(o.planes) && isNum(o.perPlane) &&
    (p.run === undefined || (Number.isInteger(p.run) && (p.run as number) >= 1)) &&
    (p.runs === undefined || Array.isArray(p.runs)) &&
    (p.contract === undefined || isObj(p.contract)) &&
    (p.players === undefined || (isObj(p.players) && Array.isArray(p.players.names))) &&
    (p.quiz === undefined || (isObj(p.quiz) && isAnswers(p.quiz.pre) && isAnswers(p.quiz.post))) &&
    (ops.votes === undefined || isObj(ops.votes)) &&
    (ops.choices === undefined || isObj(ops.choices)) &&
    (ops.launch === undefined || ops.launch === null || isObj(ops.launch));
  if (!valid) return initialState;

  const clampN = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(x)));
  const choices = Object.fromEntries(Object.entries(ops.choices ?? {}).filter(([k, v]) => !REMOVED_EVENTS.includes(k) && typeof v === 'string'));
  const l = ops.launch;
  return {
    ...initialState,
    ...p,
    difficulty: p.difficulty === 'hoc_vien' ? 'hoc_vien' : 'ky_su',
    design: { ...DEFAULT_DESIGN, ...d, parts: d.parts!.filter((id) => !REMOVED_PARTS.includes(id)), wings: !!d.wings, envTest: !!d.envTest },
    orbit: { ...DEFAULT_ORBIT, ...o, hKm: clampN(o.hKm!, 300, 800), planes: clampN(o.planes!, 1, 6), perPlane: clampN(o.perPlane!, 1, 3), chosen: !!o.chosen },
    ops: {
      ...EMPTY_OPS,
      ...ops,
      votes: { ...EMPTY_OPS.votes, ...(ops.votes ?? {}) },
      choices,
      launch: l ? { launchedWithVuot: !!l.launchedWithVuot, launchedWithNoGo: !!l.launchedWithNoGo, unanimousGo: !!l.unanimousGo } : null,
      clockMin: isNum(ops.clockMin) ? Math.min(72 * 60, Math.max(0, ops.clockMin)) : 0,
    },
    designChanges: isNum(p.designChanges) ? p.designChanges : 0,
  } as GameState;
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return sanitizeState(JSON.parse(raw));
  } catch {
    return initialState;
  }
}

export function saveState(s: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode) — game still works */
  }
}

interface Store {
  state: GameState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: GameState }) {
  const [state, dispatch] = useReducer(reducer, initial, (i) => i ?? loadState());
  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.screen]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
