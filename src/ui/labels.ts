// Plain-language labels for students (formulas unchanged; internal names stay p1h / p1hRain / vfm).
export const L_P1H = 'SOS delivered within 1 h';
export const L_P1H_RAIN = 'SOS delivered within 1 h (weighted by NASA IMERG rain)';
export const L_VFM = 'Cost efficiency';

export type TermId = 'incl' | 'plane' | 'eclipse' | 'margin' | 'lifetime' | 'cml' | 'p1h';

/** One-sentence explanation + the Guide card it links to (tab index, card title). */
export const TERMS: Record<TermId, { text: string; tab: number; card: string }> = {
  incl: {
    text: 'The tilt of the orbit against the equator — the bigger it is, the closer the satellite flies to the poles.',
    tab: 0,
    card: 'Inclination',
  },
  plane: {
    text: 'One ring of flight paths around Earth: satellites in the same plane pass Hà Nội at the same times, so all-day coverage needs several planes.',
    tab: 0,
    card: 'Orbital plane',
  },
  eclipse: {
    text: 'The part of each orbit spent in Earth’s shadow, with no sunlight, so the satellite runs on its battery.',
    tab: 0,
    card: 'Eclipse',
  },
  margin: {
    text: 'How many dB the signal is above the minimum needed; 3 dB or more means the station hears it clearly.',
    tab: 0,
    card: 'Link margin',
  },
  lifetime: {
    text: 'How many years the satellite stays up before the thin upper air drags it down to burn up.',
    tab: 0,
    card: 'Orbital lifetime',
  },
  cml: {
    text: 'A scale for how mature a mission idea is, from accepting the contract (CML 1) to launching with every requirement met and the spec sheet done (CML 4).',
    tab: 0,
    card: 'CML badge · Concept Maturity Level',
  },
  p1h: {
    text: 'The share of the time when an SOS message sent at that moment reaches the station within 1 hour.',
    tab: 0,
    card: 'SOS delivered within 1 h',
  },
};
