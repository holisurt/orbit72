// Types for public/data/*.json.
import type { LifetimeTable } from '../sim/lifetime';

export type ChassisId = '3U' | '6U' | '12U';

export interface Chassis {
  id: ChassisId;
  cells: number;
  cols: number;
  baseKg: number;
  limitKg: number;
  kusd: number;
  months: number;
  areaM2: number;
}

export type PartCat = 'bus' | 'pow' | 'com' | 'pay' | 'ext';

export interface Part {
  id: string;
  cat: PartCat;
  name: string;
  cells: number;
  kg: number;
  w: number;
  kusd: number;
  months: number;
  wh?: number;
  txW?: number;
  band?: 'uhf' | 's';
  rbps?: number;
  mbPerDay?: number;
  pointingDeg?: number;
  required?: boolean;
  sailAreaM2?: number;
  e1Immune?: boolean;
  dutyNote?: string;
}

export interface Components {
  chassis: Chassis[];
  wings: { kg: number; kusd: number; months: number; areaM2: number; orientation: number };
  envTest: { kusd: number; months: number };
  parts: Part[];
}

export type LauncherId = 'rideshare' | 'iss' | 'dedicated';

export interface Launcher {
  id: LauncherId;
  name: string;
  incl: 'SSO' | 'any' | number;
  hMin?: number;
  hMax?: number;
  hFixed?: number;
  maxChassis?: ChassisId;
  price?: { baseKusd: number; baseKg: number; perKgKusd: number };
  pricePerSatKusd?: number;
  pricePerLaunchKusd?: number;
  planesPerLaunch?: number;
  planesMax?: number;
  tag: string;
}

export interface Preset {
  id: 'sso' | 'iss' | 'low20' | 'leo53';
  name: string;
  incl: 'SSO' | number;
  h?: number;
}

export interface Launchers {
  launchers: Launcher[];
  presets: Preset[];
}

export type DifficultyId = 'hoc_vien' | 'ky_su';

export interface DifficultyRules {
  budget: number;
  gapMaxH: number;
  events: string[];
}

export interface Scenario {
  id: string;
  name: string;
  t0Local: string;
  hours: number;
  target: { name: string; lat: number; lon: number };
  partnerStation: { name: string; lat: number; lon: number };
  rainBox: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  opsYears: number;
  difficulty: Record<DifficultyId, DifficultyRules>;
  requirements: {
    devMonthsMax: number;
    powerMargin: number;
    dod: number;
    linkMarginDb: number;
    lifetimeMinY: number;
    lifetimeMaxY: number;
    residualMaxY: number;
    elevationDeg: number;
  };
  tutorial: { id: string; target: { lat: number; lon: number }; minPassesPerDay: number };
}

export interface EventOption {
  k: string;
  text: string;
  requires?: string;
  effect: Record<string, unknown>;
}

export interface GameEvent {
  id: string;
  atH: number;
  onlyIf?: string;
  title: string;
  source?: string;
  options: EventOption[];
}

export interface Events {
  events: GameEvent[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface Maps {
  world: string;
  vn: string;
  globe: string;
  seaLand: string;
}

/** public/data/imerg_yagi.json — built by data_prep/prepare_imerg.py (optional). */
export interface Imerg {
  source?: { product: string; doi: string; catalog: string; host: string };
  hours: string[]; // ISO UTC, hour 0 = T0
  hanoi_mmh: number[];
  box_mean_mmh: number[];
  grid?: {
    lon0: number; // centre of first column (°E)
    lat0: number; // centre of first row (°N); rows go north
    step: number;
    cols: number;
    rows: number;
    frames: number[][]; // hourly, row-major [r * cols + c], mm/h
  };
}

/** public/data/donki_gst.json — built by data_prep/fetch_donki.py (optional). */
export interface DonkiGst {
  startTime: string;
  kpIndex: number;
  link: string;
  gstID?: string;
  source?: string;
}

export interface GameData {
  components: Components;
  launchers: Launchers;
  scenario: Scenario;
  lifetime: LifetimeTable;
  events: Events;
  quiz: Quiz;
  imerg?: Imerg | null;
  donki?: DonkiGst | null;
}
