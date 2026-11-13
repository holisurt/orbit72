# ORBIT 72: Keep Them Connected

ORBIT 72 is a web-based space mission design game built for NASA Space Apps 2026 (Hanoi). After a Typhoon-Yagi-like storm makes landfall over northern Vietnam (T0 = 2024-09-07 14:00 ICT), players design, cost and launch a CubeSat constellation that relays SOS messages to Hanoi during the "72 Golden Hours". Under the contract's eight requirements — coverage gap, data backlog, power, orbital lifetime, budget, development time, link margin and mandatory subsystems — players move through Brief → Build → Orbit → Review → Launch, then run a 72-hour operations phase with real-world events (geomagnetic storms, ground-station power cuts, cloud cover) and finish with a debrief that explains every pass or fail. Solo and pass-the-device co-op modes are supported, with three difficulty levels.

## Play

Link: TBD (will be published at `https://holisurt.github.io/orbit72/`).

## How to run

Requires Node.js 20+.

```bash
npm install
npm run dev       # local dev server
npm test          # Vitest unit tests (acceptance values from docs/SPEC.md §10)
npm run build     # production build to dist/
npm run preview   # serve the production build
```

Deployment is automatic via GitHub Actions → GitHub Pages on push to `main`.

## NASA data

- **NASA GPM IMERG** (GES DISC) — hourly rainfall over northern Vietnam during Typhoon Yagi, used to weight coverage by rain intensity (`P1h_rain`) and as a cloud proxy for flood imaging.
- **NASA DONKI** — real geomagnetic storm (GST) records shown on the in-game storm event card.
- **NASA Small Spacecraft State of the Art (2026)** — reference for CubeSat component parameters.

All data is pre-processed into static JSON under `public/data/` (scripts in `data_prep/`). The game makes no runtime network calls.

## Use of AI

AI-assisted work is logged per checkpoint in [AI_USAGE.md](AI_USAGE.md), including what the AI did and how a human checked it.

## Credits

See [CREDITS.md](CREDITS.md) for data sources, references and fonts. This project is not affiliated with or endorsed by NASA and does not use NASA logos or insignia.

## License

[MIT](LICENSE) © 2026 ORBIT 72 team.
