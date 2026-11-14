// Load pre-built JSON + map paths from public/data (no runtime network calls beyond our own origin).
import type { GameData, Maps } from './types';

const base = `${import.meta.env.BASE_URL}data/`;

async function getJson<T>(name: string): Promise<T> {
  const r = await fetch(base + name);
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

async function getText(name: string): Promise<string> {
  const r = await fetch(base + name);
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  return (await r.text()).trim();
}

let dataPromise: Promise<GameData> | null = null;
let mapsPromise: Promise<Maps> | null = null;

export function loadGameData(): Promise<GameData> {
  dataPromise ??= Promise.all([
    getJson<GameData['components']>('components.json'),
    getJson<GameData['launchers']>('launchers.json'),
    getJson<GameData['scenario']>('scenario_72h.json'),
    getJson<GameData['lifetime']>('lifetime_6u.json'),
    getJson<GameData['events']>('events.json'),
    getJson<GameData['quiz']>('quiz.json'),
  ]).then(([components, launchers, scenario, lifetime, events, quiz]) => ({
    components,
    launchers,
    scenario,
    lifetime,
    events,
    quiz,
  }));
  return dataPromise;
}

export function loadMaps(): Promise<Maps> {
  mapsPromise ??= Promise.all([
    getText('maps/world.txt'),
    getText('maps/vn.txt'),
    getText('maps/globe.txt'),
    getText('maps/sea_land.txt'),
  ]).then(([world, vn, globe, seaLand]) => ({ world, vn, globe, seaLand }));
  return mapsPromise;
}
