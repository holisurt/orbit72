// Handbook content, ported from design/HF-Guide.dc.html. Numbers are computed from the sim and the data
// files (never typed in), so the Handbook always matches what the game uses.
import type { GameData } from '../data/types';
import { DEG, coverageRadiusKm, eclipseFraction, eclipseHours, periodMin, raanRate, slantRangeKm, ssoInclinationDeg } from '../sim/orbit';
import { BODY_FILL, CELL_EFF, DOD, POWER_LOSS, SOLAR_CONST, bodyPowerW, wingPowerW } from '../sim/power';
import { LINKS, fsplDb, linkMarginDb } from '../sim/link';
import { INTEGRATION_MONTHS } from '../sim/build';
import { CML_TEXT, RANK_PENALTY } from '../sim/score';
import { lifetimeYears } from '../sim/lifetime';
import { ROLES } from '../state/roles';
import { fmt } from './format';
import { IMERG_LABEL } from './rain';

export interface GuideItem {
  t: string; // title
  d: string; // body
  s: string; // source / tag line
  mono?: boolean;
  link?: { href: string; text: string }[];
}

export interface GuideTab {
  id: 'terms' | 'formulas' | 'science' | 'dragon' | 'sources';
  n: string; // tab name
  head: string;
  tip: string;
  items: GuideItem[];
}

const H = 520; // worked examples at the S1 altitude

export const IMERG_DOI = 'https://doi.org/10.5067/GPM/IMERG/3B-HH/07';
export const IMERG_CATALOG =
  'https://data.nasa.gov/dataset/gpm-imerg-final-precipitation-l3-half-hourly-0-1-degree-x-0-1-degree-v07-gpm-3imerghh-at-g-fb698';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function guideTabs(data: GameData): GuideTab[] {
  const req = data.scenario.requirements;
  const eps = req.elevationDeg;
  const fEcl = eclipseFraction(H);
  const c6 = data.components.chassis.find((c) => c.id === '6U')!;
  const wings = data.components.wings;
  const sail = data.components.parts.find((p) => p.sailAreaM2);
  const d10 = slantRangeKm(H, eps);
  const incl = ssoInclinationDeg(H);
  const raanDegDay = (raanRate(H, incl) / DEG) * 86400;
  const diff = data.scenario.difficulty;
  const iss = data.launchers.launchers.find((l) => l.id === 'iss');
  const ride = data.launchers.launchers.find((l) => l.id === 'rideshare');
  const dedicated = data.launchers.launchers.find((l) => l.id === 'dedicated');
  const station = (id: keyof typeof LINKS, what: string) => {
    const l = LINKS[id];
    return {
      t: `Hòa Lạc station · ${l.label}`,
      d: `${what}: ${fmt(l.fMHz, 0)} MHz, transmit ${fmt(l.pW, 1)} W, G_tx ${fmt(l.gTx, 0)} dBi, G_rx ${fmt(l.gRx, 1)} dBi, T_sys ${fmt(l.tSysK, 0)} K, other losses ${fmt(l.lMisc, 0)} dB, needs Eb/N0 ${fmt(l.reqDb, 1)} dB → link margin ${fmt(linkMarginDb(l, H, eps), 1)} dB at ${H} km, ${eps}°.`,
      s: '[GA] typical station values · formula [CT]',
    };
  };

  return [
    {
      id: 'terms',
      n: 'Glossary',
      head: 'Key terms',
      tip: 'Read this before you build!',
      items: [
        {
          t: 'Four mission segments',
          d: 'Launch = the rocket · Space = the satellite · Ground = the Hòa Lạc station · User = the rescue centre and the SOS villages. Each screen is one segment: pick a launcher, build the CubeSat, check the radio link to the station, and get scored on SOS messages reaching the rescuers.',
          s: 'Design and Develop Science Missions (NASA)',
        },
        {
          t: 'CML badge · Concept Maturity Level',
          d: `JPL’s scale for how mature a mission idea is. In the game: CML1 ${lowerFirst(CML_TEXT[1])} · CML2 ${lowerFirst(CML_TEXT[2])} · CML3 ${lowerFirst(CML_TEXT[3])} · CML4 ${lowerFirst(CML_TEXT[4])}. A level counts only when every lower level is reached.`,
          s: 'NASA JPL · shown on the Debrief screen',
        },
        {
          t: 'Inclination',
          d: `The angle between the orbit and the equator. A satellite only flies over latitudes below its inclination; an SSO is tilted ≈ ${fmt(incl, 1)}° at ${H} km, so it passes near both poles.`,
          s: 'Orbit screen',
        },
        {
          t: 'Orbital plane',
          d: 'Satellites in the same plane pass over Hà Nội at the same times — all-day coverage needs several planes.',
          s: 'Orbit screen',
        },
        {
          t: 'SSO · Sun-synchronous orbit',
          d: `Passes each place at the same local time; ≈ ${fmt(incl, 1)}° at ${H} km.`,
          s: 'Orbit screen',
        },
        { t: 'Eclipse', d: `≈ ${fmt(fEcl * 100, 1)}% of every orbit at ${H} km: the satellite lives on its battery.`, s: 'Build screen' },
        { t: 'Store-and-forward', d: 'Pick up messages over the storm area, store them, send them down when passing a station.', s: 'Mission Control' },
        {
          t: 'Link margin',
          d: `How much stronger the signal is than the minimum; ≥ ${fmt(req.linkMarginDb, 0)} dB means the link works.`,
          s: 'Orbit screen · requirement R7',
        },
        {
          t: 'Orbital lifetime',
          d: `Years the satellite stays up before the thin upper air drags it down to burn up: the lower it flies, the sooner it falls (≈ ${fmt(lifetimeYears(data.lifetime, H).years, 1)} years at ${H} km). The contract needs ${req.lifetimeMinY}–${req.lifetimeMaxY} years.`,
          s: 'Requirement R4 · FACSAT-2 table [NG]',
        },
        {
          t: 'Residual time after the mission',
          d: `Orbital lifetime minus the operating time (${data.scenario.opsYears} years); FCC rule: ≤ ${fmt(req.residualMaxY, 0)} years.`,
          s: 'Requirement R4',
        },
        {
          t: 'SOS delivered within 1 h',
          d: 'The share of the time when an SOS message sent at that moment reaches the station within 1 hour. The version weighted by NASA IMERG rain counts heavy-rain hours more, because that is when people need help most.',
          s: 'Mission Control · stars 2 and 3',
        },
      ],
    },
    {
      id: 'formulas',
      n: 'Formulas',
      head: `Formulas used in the game (example at ${H} km)`,
      tip: 'Every number in the game comes from here.',
      items: [
        { t: 'Orbital period', d: `T = 2π√(a³/μ) → ${fmt(periodMin(H), 1)} min`, s: '[CT]', mono: true },
        { t: 'Eclipse', d: `f = arccos(√(h²+2R⊕h)/a)/π → ${fmt(fEcl * 100, 1)}% · ${fmt(eclipseHours(H) * 60, 0)} min`, s: '[CT] β = 0', mono: true },
        { t: 'SSO inclination', d: `cos i = −2·Ω̇☉·a² / (3·J2·R⊕²·n) → ${fmt(incl, 2)}°`, s: '[CT]', mono: true },
        {
          t: 'Station visibility circle',
          d: `λ = arccos(R⊕cos ε/a) − ε, ε = ${eps}° → radius ${fmt(coverageRadiusKm(H, eps), 0)} km`,
          s: '[CT]',
          mono: true,
        },
        { t: 'J2 node drift', d: `Ω̇ = −1.5·J2·(R⊕/a)²·n·cos i → ${fmt(raanDegDay, 3)}°/day`, s: '[CT]', mono: true },
        {
          t: 'Free-space path loss',
          d: `FSPL = 20log d + 20log f + 32.44 → d = ${fmt(d10, 0)} km: UHF ${fmt(fsplDb(d10, LINKS.uhf.fMHz), 1)} dB · S ${fmt(fsplDb(d10, LINKS.s.fMHz), 1)} dB`,
          s: '[CT] d in km, f in MHz',
          mono: true,
        },
        {
          t: 'Link margin',
          d: 'Eb/N0 = EIRP − FSPL − L + (G_rx − 10log T_sys) + 228.6 − 10log R_b; margin = Eb/N0 − required',
          s: '[CT] station values [GA]',
          mono: true,
        },
        {
          t: 'Power generated',
          d: `${fmt(SOLAR_CONST, 0)}·${fmt(CELL_EFF, 2)}·${fmt(BODY_FILL, 1)}·(A/4)·(1−f)·${fmt(POWER_LOSS, 2)} → 6U: ${fmt(bodyPowerW(c6.areaM2, fEcl), 1)} W · wings +${fmt(wingPowerW(wings.areaM2, wings.orientation, fEcl), 1)} W`,
          s: 'S [CT]; η, k [GA]',
          mono: true,
        },
        { t: 'Battery needed', d: `P_use × t_eclipse / ${fmt(DOD, 1)} (depth of discharge)`, s: '[GA] DoD', mono: true },
        {
          t: 'Rain weighting',
          d: 'w(h) = 1 + R(h)/R̄ ; SOS within 1 h weighted by rain = Σ w·ok / Σ w',
          s: `R = mean IMERG rain over ${data.scenario.rainBox.lonMin}–${data.scenario.rainBox.lonMax}°E, ${data.scenario.rainBox.latMin}–${data.scenario.rainBox.latMax}°N`,
          mono: true,
        },
        { t: 'Cost efficiency (star 3)', d: 'Cost efficiency = SOS within 1 h weighted by rain (%) / cost (million USD)', s: 'Design cost, events not included', mono: true },
      ],
    },
    {
      id: 'science',
      n: 'Science · assumptions',
      head: 'Where the model is simplified (Science) — every [GA] assumption',
      tip: 'Saying where a model stops is good science.',
      items: [
        { t: 'Circular orbits, two bodies + J2', d: 'Ignores drag over the 72 hours and pulls from the Moon and Sun.', s: 'Small error over 72 h' },
        { t: 'Bent-pipe: Hà Nội ≈ Hòa Lạc', d: 'The station is ~30 km from Hà Nội, so both are treated as one viewing point.', s: 'Geometric approximation' },
        { t: 'Worst-case eclipse β = 0', d: 'Real eclipses change with the seasons; the game uses the hardest case.', s: 'Safe design' },
        { t: 'Minimum elevation', d: `The station only talks to a satellite more than ${eps}° above the horizon.`, s: '[GA]' },
        station('uhf', 'Yagi antenna'),
        station('s', '3 m S-band dish'),
        station('sos', 'Villagers’ handsets → satellite'),
        {
          t: 'Solar cells',
          d: `Efficiency η = ${fmt(CELL_EFF, 2)}, body fill ${fmt(BODY_FILL, 1)}, system loss ${fmt(POWER_LOSS, 2)}; wings ${fmt(wings.areaM2, 3)} m² with pointing factor ${fmt(wings.orientation, 1)}.`,
          s: '[GA]',
        },
        { t: 'Battery and power margin', d: `Depth of discharge ${fmt(req.dod, 1)}; needs P_gen ≥ ${fmt(req.powerMargin, 1)} × P_use.`, s: '[GA] · R3' },
        {
          t: 'CubeSat chassis',
          d: data.components.chassis
            .map((c) => `${c.id}: ${c.cells} cells, ${fmt(c.baseKg, 1)}/${fmt(c.limitKg, 0)} kg, ${fmt(c.kusd, 0)}k, ${c.months} months`)
            .join(' · '),
          s: '[GA] based on the CubeSat Design Spec',
        },
        {
          t: 'Prices, parts, schedule',
          d: `Part prices and specs are game-balance values, checked against NASA Small Spacecraft SOA 2026; integration +${INTEGRATION_MONTHS} months, environmental testing +${data.components.envTest.kusd}k / +${data.components.envTest.months} month.`,
          s: '[GA]',
        },
        {
          t: 'Launchers',
          d: `${ride?.name ?? 'Rideshare'}: ${ride?.price?.baseKusd ?? '—'}k per launch ≤ ${ride?.price?.baseKg ?? '—'} kg, plus ${ride?.price?.perKgKusd ?? '—'}k/kg [NG] · ${iss?.name ?? 'ISS'}: ${iss?.pricePerSatKusd ?? '—'}k per satellite [GA] · ${dedicated?.name ?? 'Dedicated'}: ${fmt(dedicated?.pricePerLaunchKusd ?? NaN, 0)}k per launch [NG]. In the game every launch succeeds.`,
          s: 'Prices [NG]/[GA] · launchers.json',
        },
        {
          t: 'Drag sail',
          d: `Opens ${fmt(sail?.sailAreaM2 ?? NaN, 1)} m² after ${data.scenario.opsYears} years of operations; the residual time shrinks by body area / (body + sail).`,
          s: '[GA] sail area',
        },
        { t: 'T0', d: 'T0 = typhoon landfall ≈ 14:00 on 7 Sep 2024, Vietnam time; operations run from T0 to T0 + 72 h.', s: '[GA] approximate' },
        {
          t: 'Difficulty',
          d: (['hoc_vien', 'ky_su'] as const)
            .map((k) => `${{ hoc_vien: 'Cadet', ky_su: 'Engineer' }[k]}: budget ${fmt(diff[k].budget, 0)}k, R1 ≤ ${fmt(diff[k].gapMaxH, 1)} h, events ${diff[k].events.join(', ')}`)
            .join(' · '),
          s: '[GA] · scenario_72h.json · E0 only without environmental testing',
        },
        {
          t: 'Contract requirements R1–R8',
          d: `R3 power generated ≥ ${fmt(req.powerMargin, 1)} × power used · R4 lifetime ${req.lifetimeMinY}–${req.lifetimeMaxY} years, or with a drag sail residual ≤ ${req.residualMaxY} years · R6 development ≤ ${req.devMonthsMax} months · R7 link margin ≥ ${fmt(req.linkMarginDb, 0)} dB at ${eps}° elevation.`,
          s: '[GA] · R4 5 years per FCC 22-74 [NG]',
        },
        {
          t: 'Status thresholds',
          d: 'PASS ≤ 80% of the limit · NEAR 80–100% · OVER > 100%. Always compared on the rounded numbers you see (hours, %, dB, W: 1 decimal; months, thousand USD: whole numbers).',
          s: '[GA] · SPEC §3, §7',
        },
        {
          t: 'Five stars',
          d: `Star 1 = round(5 × requirements passed / 8). Star 2 from SOS delivered within 1 h (weighted by rain): ≥ 70% → 5, ≥ 55% → 4, ≥ 40% → 3, ≥ 25% → 2. Star 3 cost efficiency = that % / million USD: ≥ 20 → 5, ≥ 17 → 4, ≥ 14 → 3, ≥ 10 → 2. Star 4 = 100 − 25 (launched with an OVER) − 10 (launched over a NO-GO) − ${RANK_PENALTY.middle}/${RANK_PENALTY.worst} for each medium/worst option + 10 if better than last run. Star 5 (solo) = 40 environmental testing + 30 power margin ≥ 20% + 30 budget reserve ≥ 5%; co-op = 20 × priority cards met + 20 for 4/4 GO.`,
          s: '[GA] · SPEC §7',
        },
        {
          t: 'Secret priority cards (co-op)',
          d: (['FD', 'VT', 'KH', 'QD'] as const).map((r) => `${ROLES[r].ab}: (a) ${ROLES[r].cards.a} · (b) ${ROLES[r].cards.b}`).join(' — '),
          s: '[GA] · SPEC §8',
        },
        {
          t: 'Event card effects',
          d: data.events.events
            .map((e) => `${e.id} ${e.title} (T0${e.atH < 0 ? ' before' : '+' + e.atH + ' h'}): ${e.options.map((o) => `${o.k} ${o.text}`).join(' / ')}`)
            .join(' · '),
          s: '[GA] · events.json · real storm record: NASA DONKI',
        },
        {
          t: 'Launch timeline',
          d: 'The times T−10 s → T+1:30:00 on the Launch screen are only illustrative (they depend on the rocket); they do not affect the score.',
          s: 'Illustrative · design/HF-Launch',
        },
        {
          t: 'Rain map colours',
          d: 'The colour steps (0.5 · 2 · 5 · 10 · 20 mm/h and 25 · 50 · 100 · 200 · 300 mm) are only for drawing the map, not for scoring.',
          s: 'Display · rain values from NASA IMERG [NG]',
        },
      ],
    },
    {
      id: 'dragon',
      n: 'Dragon files',
      head: 'True stories',
      tip: 'Every event card comes from something real.',
      items: [
        { t: 'NanoDragon · 2021', d: '3U CubeSat, 3.8 kg, AIS, SSO ~560 km; contact was lost after launch.', s: 'Lesson: have a backup link' },
        { t: 'LOTUSat-1', d: 'A ~600 kg radar satellite; its launch slipped to fiscal year 2027 after an Epsilon engine test failure.', s: 'Lesson: launch delays happen' },
        { t: 'FACSAT-2 · 2023–2025', d: 'A 6U expected to last ≥ 5 years fell after 926 days because the solar cycle was stronger than forecast.', s: 'Lesson: an active Sun makes satellites fall early' },
        { t: 'Typhoon Yagi · Sep 2024', d: '6,285 telecom stations lost contact after power cuts in 15 provinces and cities.', s: 'Why “72 Golden Hours” exists' },
        { t: 'PicoDragon · 2013', d: 'A ~1 kg satellite released from the International Space Station.', s: 'Inspiration for the “ISS Deployer”' },
        { t: 'Strong geomagnetic storm', d: 'Atmospheric drag rises ~1.9 times on a strong storm day.', s: 'Event card E1' },
      ],
    },
    {
      id: 'sources',
      n: 'Sources',
      head: 'Data sources and credits',
      tip: 'No NASA logo is used anywhere.',
      items: [
        {
          t: IMERG_LABEL,
          d: 'Hourly rain over northern Vietnam, 7–10 Sep 2024 (Final Run only): weights for “SOS delivered within 1 h”, the 72-hour rain map on the Contract screen, the rain layer in Mission Control.',
          s: 'GPM_3IMERGHH v07 · NASA GES DISC',
          link: [
            { href: IMERG_DOI, text: 'DOI 10.5067/GPM/IMERG/3B-HH/07' },
            { href: IMERG_CATALOG, text: 'data.nasa.gov' },
          ],
        },
        {
          t: 'NASA DONKI',
          d: data.donki
            ? `Real geomagnetic storm record for event card E1 (${data.donki.gstID ?? data.donki.startTime}, Kp ${fmt(data.donki.kpIndex, data.donki.kpIndex % 1 ? 2 : 0)}).`
            : 'Real geomagnetic storm record for event card E1.',
          s: 'CCMC · Space Weather Database Of Notifications, Knowledge, Information',
          link: data.donki?.link ? [{ href: data.donki.link, text: 'GST record' }] : undefined,
        },
        { t: 'NASA Small Spacecraft SOA 2026', d: 'Ranges for part specifications; deorbit rules.', s: 'NASA Ames · Small Spacecraft Systems Virtual Institute' },
        {
          t: 'Challenge resources (Space Apps 2026)',
          d: 'Design and Develop Science Missions · GMAT (General Mission Analysis Tool) · JPL Concept Maturity Levels · Mission Design Lab · NASA Mission Viz · NASA telescope learning game · CubeSat 101 · Space Apps 2023 VR challenge · CSA (Canadian Space Agency) digital games.',
          s: 'Methods and tools, not data · CREDITS.md',
        },
        {
          t: 'arXiv:2609.24534 (2026)',
          d: '6U CubeSat lifetime table (FACSAT-2), J2, drag factor ×1.92 during geomagnetic storms.',
          s: 'Vargas Domínguez et al.',
          link: [{ href: 'https://arxiv.org/abs/2609.24534', text: 'arxiv.org/abs/2609.24534' }],
        },
        {
          t: 'Natural Earth',
          d: 'Coastlines and borders for the maps and the globe.',
          s: 'Public domain',
          link: [{ href: 'https://www.naturalearthdata.com/', text: 'naturalearthdata.com' }],
        },
        { t: 'Vietnam MIC via VnEconomy', d: 'Number of telecom stations cut off by Typhoon Yagi.', s: '13 Sep 2024' },
        {
          t: 'Rules and launch prices',
          d: 'FCC 22-74 (5-year deorbit rule) · CubeSat Design Specification (Cal Poly) · 2026 rideshare prices (New Space Economy) · Vietnamese Government Decisions 1131 (2025) and 21/2026.',
          s: '[NG] SPEC §11',
        },
        { t: 'Fonts and artwork', d: 'Be Vietnam Pro, IBM Plex Mono (SIL OFL 1.1); mascot, satellites and patch are original drawings.', s: 'CREDITS.md' },
      ],
    },
  ];
}
