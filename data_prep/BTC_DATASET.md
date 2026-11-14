# BTC Dataset

## What it is
The challenge Resources tab contains methodology and tools, **no numeric dataset**:
- Design and Develop Science Missions (NASA): mission segments: launch, space, ground, user
- GMAT: General Mission Analysis Tool (NASA)
- JPL Concept Maturity Levels (CML 1–4)
- NASA Mission Design Lab
- NASA Mission Viz
- NASA telescope learning game
- CubeSat 101 (NASA)
- 2023 Space Apps VR mission challenge
- CSA (Canadian Space Agency) digital games

## Format
Web pages, PDFs and software tools (methodology and reference material). There are no tables or time series to ingest, so `adapt_btc_dataset.py` stays a stub.

## Relevant to ORBIT 72?
Yes, as methodology rather than data. The segment model shapes the game's flow, and the CML scale becomes a Debrief badge (SPEC §12). The numeric inputs still come from the sources in SPEC §11 (IMERG, DONKI, FACSAT-2 lifetime table, etc.).

## How we use it
- **Segment mapping**
  - Launch → launcher choice (Rideshare SSO / ISS deploy / Dedicated)
  - Space → CubeSat build (chassis, parts, wings, environmental test)
  - Ground → Hoa Lac station, link budget (R7), event E2 (power cut)
  - User → rescue centre and SOS villages, scored by P1h_rain
- **CML badge** in Debrief (highest Concept Maturity Level reached, see SPEC §12)
- **References** listed in Guide > Nguồn and in CREDITS.md
