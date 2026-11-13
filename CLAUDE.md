# ORBIT 72 — Bắt Sóng Cứu Hộ (NASA Space Apps 2026 · Space Mission Design Game)

Web game (Vietnamese UI, English project page). Players design a CubeSat constellation that relays SOS
messages for 72 hours after a Typhoon-Yagi-like storm hits northern Vietnam.
**Single source of truth: `docs/SPEC.md`** (derived from GDD v1.2). Never invent numbers — every constant
must come from SPEC and keep its provenance tag: [CT] physics, [NG] sourced, [GA] game assumption.

## Stack (fixed — do not add frameworks)
- Vite + React 18 + TypeScript, plain CSS with design tokens (`src/styles/tokens.css`), SVG for maps/charts.
- State: React `useReducer` + context, persisted to `localStorage` (key `orbit72.v1`).
- Tests: Vitest. Deploy: GitHub Actions → GitHub Pages (`base: '/<repo-name>/'` in vite.config.ts).
- No backend, no runtime network calls, no API keys in the repo. All data is pre-built JSON in `public/data/`.
- Allowed extra deps only if asked: none expected (no Phaser, no chart libs, no UI kits).

## Structure
```
src/sim/      orbit.ts power.ts link.ts lifetime.ts coverage.ts ops.ts score.ts  (pure functions, no React)
src/data/     types.ts loaders.ts
src/state/    store.tsx (reducer, actions, persistence)
src/screens/  Home Setup Brief Build Orbit Review Launch Ops Debrief Share Guide Quiz
src/ui/       Hud.tsx Stepper.tsx StatusChip.tsx Panel.tsx Mascot.tsx Patch.tsx MapWorld.tsx MapVN.tsx Globe.tsx
public/data/  components.json launchers.json scenario_72h.json events.json lifetime_6u.json quiz.json
              imerg_yagi.json donki_gst.json (built by data/ scripts) maps/*.txt (SVG paths, Natural Earth)
tests/        one file per sim module; acceptance values from SPEC §10
data_prep/    Python: prepare_imerg.py, fetch_donki.py, adapt_btc_dataset.py (+ README)
design/       hi-fi HTML mockups (reference only — port layout/CSS, do not import)
```

## Rules
1. Sim first, UI second. A sim function is "done" only when its SPEC §10 test passes.
2. Port screens from `design/HF-*.dc.html`: copy layout, colours, copy text; replace `{{holes}}` with props/state.
   Ignore the `DCLogic`/`x-dc` scaffolding.
3. Display rounding rule (SPEC §7): compare thresholds with values rounded as displayed (1 decimal for h, %, dB, W).
4. Vietnamese UI text with diacritics; numbers use comma decimal (`3,0 h`). Font: Be Vietnam Pro + IBM Plex Mono.
5. Status always as text + colour (ĐẠT / SÁT / VƯỢT). Touch targets ≥ 44 px. Respect prefers-reduced-motion.
6. Never use the NASA logo/insignia. Credit data sources in Guide → Nguồn and in CREDITS.md.
7. Log every AI-assisted change in `AI_USAGE.md` (one line per checkpoint is enough).
8. After each task: `npm test && npm run build`, then commit with message `cpN: <what>`.

## Commands
`npm run dev` · `npm test` · `npm run build` · `npm run preview`
