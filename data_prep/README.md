# data_prep

Python scripts that build the static NASA data files in `public/data/`. The game never calls these
services at runtime, and it still works when the files are missing (rain weight w = 1, no rain
clouds, E1 card without a DONKI record).

```bash
python -m venv .venv && .venv\Scripts\activate      # Windows (macOS/Linux: source .venv/bin/activate)
pip install -r data_prep/requirements.txt
python data_prep/prepare_imerg.py    # needs a NASA Earthdata login
python data_prep/fetch_donki.py      # NASA_API_KEY optional (DEMO_KEY by default)
```

| Script | Output | Source |
|---|---|---|
| `prepare_imerg.py` | `public/data/imerg_yagi.json` | NASA GPM IMERG **Final Run** half-hourly, GPM_3IMERGHH v07, DOI [10.5067/GPM/IMERG/3B-HH/07](https://doi.org/10.5067/GPM/IMERG/3B-HH/07), [data.nasa.gov](https://data.nasa.gov/dataset/gpm-imerg-final-precipitation-l3-half-hourly-0-1-degree-x-0-1-degree-v07-gpm-3imerghh-at-g-fb698), hosted by NASA GES DISC |
| `fetch_donki.py` | `public/data/donki_gst.json` | NASA DONKI GST (strongest 2024 storm) |
| `adapt_btc_dataset.py` | — | stub; the challenge resources contain no numeric dataset ([BTC_DATASET.md](BTC_DATASET.md)) |

Rules:
- IMERG: use the Final Run only. Early (`GPM_3IMERGHHE`) and Late (`GPM_3IMERGHHL`) runs are rejected by the script.
- Window 2024-09-07 07:00 UTC → 2024-09-10 07:00 UTC (T0 = landfall 14:00 ICT), bbox 100–112°E, 15–25°N.
- `box_mean_mmh` is the hourly mean over 103–108°E, 20–23°N, used for the P1h_rain weights (SPEC §6).
- Grid frames: `lon0`/`lat0` are the centre of the first column/row, rows go north, values are row-major mm/h.
- Raw downloads go to `data_prep/raw/` (git-ignored).
