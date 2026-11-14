# ORBIT 72 — Claude Code prompts (paste one at a time; wait for tests to pass before the next)

## CP0 · 09:30–09:45 · Setup (người làm: mentor)
P0. Read CLAUDE.md and docs/SPEC.md. Do not write code yet. Reply with: (1) a numbered task list for checkpoints CP1–CP6 matching docs/PROMPTS.md, (2) any contradiction or missing value you find in SPEC. Keep it under 40 lines.

## CP1 · 09:45–11:00 · Nền móng: dự án, mô phỏng, dữ liệu
P1.1 Scaffold the project exactly as CLAUDE.md "Stack" and "Structure": Vite + React 18 + TypeScript + Vitest, `src/styles/tokens.css` with the colours/fonts listed in design/HF-Home.dc.html (bg #070D1A, panel #0F1830, line #26355A, text #E8EEF8, muted #9AABC7, amber #F5A524, cyan #3DD6F5, ok #4ADE80, warn #FBBF24, bad #F87171; Be Vietnam Pro + IBM Plex Mono via Google Fonts). Copy data/*.json to public/data/ and assets/maps/*.txt to public/data/maps/. Add `.github/workflows/deploy.yml` (checkout → setup-node 20 → npm ci → npm test → npm run build → upload-pages-artifact → deploy-pages) and set vite `base` to `/${REPO}/`. Add README.md, LICENSE (MIT), CREDITS.md, AI_USAGE.md skeletons. One placeholder screen "ORBIT 72". Run tests/build, commit "cp1: scaffold".
P1.2 Implement `src/sim/orbit.ts, coverage.ts, power.ts, link.ts, lifetime.ts` as pure TypeScript functions following SPEC §3–§5 exactly. Write tests in `tests/` for EVERY value in SPEC §10 that these modules produce (orbit, eclipse, λ, SSO inclination, FSPL, link margins, power, battery, downlink, lifetime, sail, all coverage rows). Coverage must use 1-minute steps over 72 h with J2 RAAN drift and the plane/phase rule. Iterate until all tests pass. Commit "cp1: sim + tests".
P1.3 Create `data_prep/` (Python, requirements.txt): (a) `prepare_imerg.py` using `earthaccess` to download GPM IMERG half-hourly (GPM_3IMERGHH, latest version available) for 2024-09-07 07:00 → 2024-09-10 07:00 UTC, bbox 100–112°E, 15–25°N, output `public/data/imerg_yagi.json` = {hours:[ISO], hanoi_mmh:[...], box_mean_mmh:[...] (103–108°E, 20–23°N), grid:{lon0,lat0,step:0.25,cols,rows,frames:[hourly arrays, rounded 1 decimal]}} under 400 KB; (b) `fetch_donki.py` calling DONKI GST (api.nasa.gov, DEMO_KEY by default, key from env) for 2024 and saving the strongest storm {startTime, kpIndex, link} to `public/data/donki_gst.json`; (c) `adapt_btc_dataset.py` stub + README describing how to map the organisers' dataset into the same JSON schema. Make the game work if these files are missing (w = 1, fixed cloud window). Commit "cp1: data pipeline".
CHECK CP1 (11:00): `npm test` green · Pages URL shows placeholder · imerg_yagi.json + donki_gst.json present (or documented fallback) · tag `cp1`.

## CP2 · 11:00–12:30 · Thiết kế sứ mệnh: Home, Setup, Brief, Build, Orbit
P2.1 Implement `src/state/store.tsx` (useReducer + context + localStorage autosave/resume) with state: mode, difficulty, players/roles/priority cards, contract, design {chassis, parts[], wings, envTest}, orbit {preset, h, P, k, launcher}, ops {events chosen}, runs[], quiz {pre, post}. Implement `src/ui/` primitives (Panel, Stepper, StatusChip, Hud, Mascot, Globe, MapWorld, MapVN using public/data/maps paths). Commit.
P2.2 Port screens Home, Setup, Brief, Build from design/HF-Home, HF-Setup, HF-Brief, HF-Build (.dc.html): same layout, colours, Vietnamese text, interactions (difficulty, roles/priority cards/pass screen, contract, part add/remove/chassis/wings/test, tutorial coach mark). HUD values must come from src/sim (SPEC §3). Enforce hard constraints (R8, cells, mass) with messages. Commit.
P2.3 Port screen Orbit from design/HF-Orbit.dc.html: presets, altitude slider, P and k steppers, launchers with compatibility + cost, world map ground tracks, 72-h visibility strip, metrics with R1/R4/R5 chips, link margins (R7). Use src/sim, not the mockup's inline code. Commit, push, check Pages.
CHECK CP2 (12:30): play Home → Orbit on phone and laptop; default S1 (SSO 520, 4×1, rideshare) shows 3,0 h · 49 % · 2.640k · L 6,5 năm · margins 9,7/8,4/9,3 dB · tag `cp2`.

## CP3 · 13:00–14:30 · Phóng, vận hành 72 giờ, báo cáo
P3.1 Implement `src/sim/ops.ts` and `src/sim/score.ts` per SPEC §6–§7: event masks E0–E4, E2-B deferral, E2-C relay via HCMC visibility, option ranking by P1h, IMERG weights → P1h_rain, imaging side goal, five stars, outcome, why-chain sentences. Add tests: S1 events E1 = 46/48/48 %, E2 = 49/45/48 %, P1h_rain(w=1) = P1h, star formulas on S1. Commit.
P3.2 Port Review (checklist R1–R8 from sim, nominal design; Go/No-Go poll per role), Launch (stages; giam_doc launch failure with seeded RNG), Ops (HF-Ops: 72-h strip, IMERG rain overlay from imerg_yagi.json on MapVN with time slider, event cards with live consequence numbers, E1 card shows DONKI record), Debrief (HF-Debrief: outcome, stars with formula lines, why-chain, spec sheet), Share (HF-Share: patch SVG with 14-ray star, result card; PNG export via canvas, Web Share API fallback to download). Commit, push.
Debrief also shows the CML badge (SPEC §12).
CHECK CP3 (14:30): one full run S1 Kỹ sư without errors; debrief shows 8/8 THÀNH CÔNG; PNG downloads · tag `cp3`.

## CP4 · 14:30–15:30 · Hoàn thiện & thử nghiệm
P4.1 Add Quiz screen (public/data/quiz.json) before Brief and after Debrief; show learning gain in Debrief. Add Guide screen (HF-Guide: Thuật ngữ, Công thức, Science/giả định, Hồ sơ Rồng, Nguồn) reachable from every screen. Add Settings (VI/EN labels for menus, text size 100/125/150 %, reduced motion, reset). Accessibility pass: focus order, aria-labels on SVG, contrast, 44 px targets. Mobile landscape layout for ≤ 900 px. Commit, push, tag `v0.9`.
Guide > Nguồn lists the challenge resources; Guide adds a card 'Bốn phân đoạn sứ mệnh'.
P4.2 Write `tests/e2e-checklist.md` (manual): 12 steps covering every screen and edge cases from GDD §12. Run it yourself where possible (build + preview) and fix blockers only.
CHECK CP4 (15:30): v0.9 live · 3 playtesters complete pre/post quiz (record scores in docs/playtest.md) · BTC progress form sent.

## CP5 · Chủ nhật 08:00–09:00 · Sửa lỗi & đóng gói
P5.1 Fix the bugs listed in docs/playtest.md (highest severity first). No new features.
P5.2 Create a static landing page at `/about` (port design/Website.dc.html, English) linking to the game, guidebook PDF and repo. Finalise README (what/how to run/data/AI use/credits, English), CREDITS.md, AI_USAGE.md. Commit, push.
(Người: quay video 30 s theo kịch bản trong file Nộp bài & Pitch; tải YouTube chế độ không công khai.)
CHECK CP5 (09:00): no blocker bugs · /about live · README complete · video link ready (or 7-slide deck link).

## CP6 · 09:00–10:00 · Đóng băng, kiểm định, nộp, bàn giao
P6.1 Run `npm test`, `npm run build`, open preview, walk tests/e2e-checklist.md. Report pass/fail only; fix only blockers. Then tag `v1.0-hanoi` and push.
(Người: kiểm tra link ở chế độ ẩn danh trên 2 thiết bị · Team Owner điền và bấm Submit trên spaceappschallenge.org trước 09:50 · 10:00 bàn giao cho em.)
