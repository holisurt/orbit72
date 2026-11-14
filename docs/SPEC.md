# ORBIT 72 — SPEC (from GDD v1.2) — for Claude Code
Tags: [CT] standard physics/constant · [NG] sourced (see §11) · [GA] game assumption (show in Science tab)

## 1. Flow (state machine)
Home → Setup (co-op only) → Quiz(pre) → Brief → Build → Orbit → Review → Launch → Ops(72 h) → Debrief → Quiz(post) → Share
- Back allowed among Brief/Build/Orbit before launch; after launch only "Sửa & chạy lại" (Debrief → Build, keeps design+orbit, resets ops/events, run++).
- Autosave to localStorage on every screen change; reload resumes at start of last screen.
- Difficulty: `hoc_vien` (budget 3500, R1 ≤ 6.0 h, lifetime=avg, events E1,E2 with hints, no launch risk) ·
  `ky_su` (3000, ≤ 3.5 h, avg, E0*,E1,E2,E3) · `giam_doc` (2800, ≤ 3.5 h, lifetime=max column, E0*,E1–E4, launch fail 3%/launch, seeded RNG). *E0 only if no environmental test. [GA]

## 2. Contract "72 Giờ Vàng" (ky_su)
T0 = landfall = 2024-09-07 14:00 ICT [GA approx]. Ops window T0 → T0+72 h. Target = Hanoi (21.03°N, 105.85°E); Hoa Lac station ≈ same point (bent-pipe approx).
| R | Requirement | Threshold | Hard? |
|---|---|---|---|
| R1 | longest coverage gap over 72 h (nominal design) | ≤ 3.5 h | soft |
| R2 | data produced ≤ data downlinked, per satellite per day | no backlog | soft |
| R3 | P_gen ≥ 1.1·P_use and battery ≥ P_use·t_ecl/0.3 | — | soft |
| R4 | orbital lifetime L: 3 ≤ L ≤ 8 yr, or with drag sail residual ≤ 5 yr | — | soft |
| R5 | total cost ≤ budget (hard at contract signing) | 3000 kUSD | hard/soft |
| R6 | development time | ≤ 18 months (else ops run with no satellites: P1h=0) | soft |
| R7 | every link margin at 10° elevation | ≥ 3 dB | soft |
| R8 | has OBC, EPS, ADCS, transmitter, SOS payload; cells & mass within chassis | — | hard |
Events affect only stars 2 and 4; R1–R8 are judged on the nominal design at launch.

## 3. Build
Chassis [GA]: 3U {cells 6, base 0.6 kg, limit 6 kg, 80 k, 2 mo, body area 0.156 m²} · 6U {12, 1.2, 12, 150, 3, 0.267} · 12U {24, 2.4, 24, 280, 4, 0.410}.
Parts: see `public/data/components.json` (cells, kg, power W, kUSD, months, extra props).
Formulas:
- Mass = base + Σkg (+0.6 wings).
- P_gen = 1361 [CT] × 0.29 × 0.7 × (A_surface/4) × (1 − f_ecl) × 0.85  (η, fill, loss [GA]; A/4 = mean projected area of convex body [CT]).
  Wings add 1361 × 0.29 × 0.85 × 0.136 × 0.5 × (1 − f_ecl) × 0.85 (orientation factor 0.5 [GA]).
  Check @520 km (f_ecl 0.376): 3U 5.7 W · 6U 9.8 W · 12U 15.0 W · wings +12.1 W.
- P_use = Σ continuous loads + Σ tx_W × contact_min_per_day/1440 + camera 5 W × 0.10.
- Battery need = P_use × t_ecl[h] / 0.3 (DoD [GA]); t_ecl = f_ecl × T.
- Cost per sat = chassis + Σparts (+60 wings) (+30 env test). Total = N × per-sat + launches (+ event costs).
- Dev months = chassis.mo + max(parts.mo, wings?3) + 4 integration (+1 test).
- Data: produced = Σ payload MB/day (camera × 0.4 if edge OBC); downlink = R_b × contact_min × 60 / 8 bytes.
  Before an orbit is chosen use defaults f_ecl = 0.376, contact = 17 min/day.
- Status: ĐẠT ≤ 80 % of limit · SÁT 80–100 % · VƯỢT > 100 %.

## 4. Orbit & coverage [CT]
R⊕ 6378.14 km · μ 398600.4418 km³/s² · ω⊕ 7.2921159e-5 rad/s · J2 1.08263e-3 · Ω̇☉ 1.991e-7 rad/s.
- a = R⊕ + h; n = √(μ/a³); T = 2π/n.
- SSO inclination: cos i = −2·Ω̇☉·a² / (3·J2·R⊕²·n)  (→ 97.48° @520).
- RAAN drift: Ω̇ = −1.5·J2·(R⊕/a)²·n·cos i.
- Sub-satellite point: u = n·t + phase; lat = asin(sin i · sin u); lon = Ω0 + Ω̇t + atan2(cos i·sin u, cos u) − ω⊕t.
- Visible if central angle(sub-point, Hanoi) ≤ λ = acos(R⊕ cos ε / a) − ε, ε = 10° [GA].
- Eclipse fraction (β=0): f = acos(√(h²+2R⊕h)/a)/π.
- Constellation: P planes × k sats/plane. Ω0_p = 105.5° + p·S/P with S = 180° for SSO, 360° otherwise;
  phase = s·2π/k + p·π/(P·k). ISS preset forces P = 1, h = 400.
- Simulate 72 h at 1-min steps → vis[m]. Metrics: longest gap (no wrap), P1h = % of minutes m whose next visible minute is ≤ 60 min away, contact min/day/sat.
- Presets: SSO (h 480–600 for rideshare) · ISS 51.6° (h 400) · Low 20° · LEO 53°.
- Launchers: Rideshare SSO {SSO & 480≤h≤600; 350 k per launch ≤ 50 kg + 7 k/kg above [NG]; 1 plane per launch} ·
  ISS deploy {51.6°, h 400, chassis ≤ 6U; 250 k per sat [GA]; 1 plane} · Dedicated {any; 7500 k per launch [NG]}.

## 5. Lifetime & link
Lifetime table 6U, B=72.3 kg/m² [NG FACSAT-2]: h(km) → avg(120 sfu)/max(170 sfu) years:
450 1.8/1.0 · 480 3.2/1.6 · 509 5.4/2.5 · 520 6.5/2.9 · 550 10.9/4.6 · 580 18.0/7.1 · 600 24.9/9.4.
Interpolate log-linearly; outside 450–600 extrapolate with the end segment and label "ngoại suy".
Drag sail (deployed at end of 3-yr ops): residual = (L − 3) × 0.047/(0.047 + 0.5) [A_body NG, A_sail GA].
Link (per band) [CT formulas, GA station params]:
d = √(a² − (R⊕cos ε)²) − R⊕ sin ε · FSPL = 20log d_km + 20log f_MHz + 32.44 · EIRP = 10log P + G_tx − L_line ·
C/N0 = EIRP − FSPL − L_misc + (G_rx − 10log T_sys) + 228.6 · Eb/N0 = C/N0 − 10log R_b · margin = Eb/N0 − req.
| band | f MHz | P W | G_tx | L_line | L_misc | G_rx | T_sys K | R_b | req dB |
| UHF down | 437 | 1 | 0 | 1 | 3 | 14 | 500 | 9600 | 12 |
| S down | 2200 | 2 | 6 | 1 | 1 | 34.2 | 150 | 2e6 | 12.5 |
| SOS up | 437 | 0.5 | 2 | 0 | 3 | 0 | 700 | 300 | 12 |

## 6. Ops (72 h) & NASA data
- Clock T0→T0+72 h; speeds ×60, ×360, ×1440; pause on event cards.
- Events (mask = minutes with no delivery): E0 (no env test) A: sat#1 masked first 12 h · B: sat#1 lost.
  E1 T0+10 h geomagnetic storm (card shows a real DONKI GST record: date, Kp) A: mask 6 h · B: if shielding none lost, else lose next visible window · C: mask 2 h.
  E2 T0+30 h Hoa Lac power cut 8 h: A generator −20 k, no loss · B: messages received in outage delivered at first Hanoi visibility after outage end · C: store-and-forward via HCMC station (10.82°N, 106.63°E): delivered at first HCMC visibility after reception.
  E3 T0+50 h clouds: A no change · B wasted imaging (no images) · C 30 % of daylight passes in E3 window count.
  E4 (giam_doc) T0+20 h debris: A (needs propulsion) that sat loses 2 windows · B no loss, decision penalty.
  Rank options by resulting P1h (ties = best).
- IMERG weighting: R(h) = hourly mean rain over 103–108°E, 20–23°N; w(h) = 1 + R(h)/mean(R);
  P1h_rain = Σ_m w·ok / Σ_m w. If no IMERG file: w = 1. Cloud proxy for imaging: Hanoi-cell rain ≥ 0.1 mm/h [GA].
- Flood-imaging side goal: camera + precise ADCS; valid pass = start 06:00–18:00 ICT and not cloudy; ≥ 3 → +1 star (star 2, max 5).

## 7. Scoring
Star1 = round(5 × R_passed/8) · Star2 from P1h_rain: ≥70→5, ≥55→4, ≥40→3, ≥25→2, else 1 (+1 imaging, max 5) ·
Star3 VFM = P1h_rain% / cost(million USD): ≥20→5, ≥17→4, ≥14→3, ≥10→2, else 1 ·
Star4 = 100 − 25 (launch with any VƯỢT) − 10 (launch with NO-GO) − 10/20 per middle/worst event choice + 10 if overall > previous run; stars = ceil(score/20), min 1 ·
Star5 co-op = 20 × priority cards met + 20 if unanimous GO; solo = 40 (env test) + 30 (power margin ≥ 20 %) + 30 (budget margin ≥ 5 %) → ceil(/20).
Outcome: THÀNH CÔNG (8/8 and in orbit) · MỘT PHẦN (≥ 6/8) · THẤT BẠI.
Rounding: compare thresholds using displayed values (h, %, dB, W to 1 decimal; months, kUSD integer).
Why-chain: for each failed/near R: "[quantity] = X, threshold Y → consequence. Try: [lever]" (R1→planes/inclination, R2→S-band, R3→wings/battery, R4→altitude/sail, R5→fewer launches, R6→simpler parts, R7→band/altitude).

## 8. Co-op
Players 4: FD · VT · KH · QĐ; 3: FD · VT+KH · QĐ; 2: FD+QĐ · VT+KH.
Priority cards (random a/b per role): FD (a) cost ≤ 90 % budget (b) reserve ≥ 200 k · VT (a) power margin ≥ 20 % (b) env test ·
KH (a) ≥ 2 payloads (b) P1h ≥ 55 % · QĐ (a) gap ≤ 3.0 h (b) all link margins ≥ 6 dB.
Pass-the-device screen before each role's turn. Go/No-Go: FD calls POWER/SCIENCE/BUDGET/COMMS; NO-GO requires a reason (R code).

## 9. Quiz (pre & post, same 5 questions; store locally) — see public/data/quiz.json. Learning gain = post − pre.

## 10. Acceptance tests (tolerance 1 %, gaps ±0.1 h, % ±1)
T(500)=94.6 min · T(520)=95.0 · T(420)=93.0 · f_ecl(500)=37.8 % · f_ecl(520)=37.6 % · λ(500)=1564 km ·
SSO i(500)=97.4° · i(520)=97.48° · i(550)=97.59° · FSPL(1744 km, 437/2200 MHz)=150.1/164.1 dB ·
margins @520,10°: UHF 9.7 · S 8.4 · SOS 9.3 dB (90°: 20.2 · 18.9 · 19.8) · P_gen 3U/6U/12U = 5.7/9.8/15.0 W, wings +12.1 ·
reference design (6U: OBC, EPS, ADCS basic, S-band, SOS) P_use 3.27 W, battery need 6.5 Wh, cost 310 k/sat, 11 months ·
downlink @17 min: UHF 1.22 MB, S 255 MB · L(520)=6.5 y, L(550)=10.9 y · sail @600 → residual 1.9 y ·
coverage (gap h / P1h % / contact min/day/sat): SSO520 1×1 11.9/12/19 · 1×3 11.1/22/17 · 2×1 6.0/25/17 · 3×1 4.4/38/17 ·
4×1 3.0/49/17 · 3×2 3.2/58/16 · 5×1 2.9/61/17 · ISS 1×1 13.2/14/16 · Low20 3×1 1.6/73/41 · LEO53@550 1×1 13.6/16 · 3×1 5.9/42 · 5×1 3.7/57 ·
S1 (4×1) events: E1 A/B/C = 46/48/48 % · E2 A/B/C = 49/45/48 % · tutorial (3U SSO 520, target 16°N 112°E) 3 passes/day ·
costs S1 = 2640 k, S2 (3×2) = 2910 k · P1h_rain with w=1 must equal P1h ·
CML badge (§12): S1 run with spec sheet export → CML4.

## 11. Sources
[NG] VnEconomy 13/09/2024 (6,285 stations, Yagi) · Decision 1131/QĐ-TTg (2025), 21/2026/QĐ-TTg · FCC 22-74 5-year rule ·
CubeSat Design Spec (Cal Poly) · Vargas Domínguez et al., arXiv:2609.24534 (FACSAT-2 lifetime table, J2, storm drag ×1.92) ·
rideshare 2026 pricing (New Space Economy) · NASA GPM IMERG (GES DISC) · NASA DONKI · NASA Small Spacecraft SOA 2026 · Natural Earth (public domain).

## 12. Challenge resources
The challenge Resources tab provides methodology and tools, not numeric data (details in `data_prep/BTC_DATASET.md`; titles in CREDITS.md).
Segment mapping (from "Design and Develop Science Missions"):
| Segment | In ORBIT 72 |
|---|---|
| Launch | launcher choice (§4: Rideshare SSO / ISS deploy / Dedicated) |
| Space | CubeSat build (§3: chassis, parts, wings, env test) |
| Ground | Hoa Lac station, link budget (§5, R7), event E2 |
| User | rescue centre and SOS villages, scored by P1h_rain (§6) |
CML badge (JPL Concept Maturity Levels) shown in Debrief. The badge is the highest level reached, and each level requires the ones below it:
- CML1: contract accepted.
- CML2: all hard constraints pass (R8, and budget at signing, R5).
- CML3: the player compared ≥ 2 configurations (changed planes, chassis or altitude) or did ≥ 1 rerun.
- CML4: launched with R1–R8 all ĐẠT and exported the spec sheet.
