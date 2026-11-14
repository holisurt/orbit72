"""Build public/data/imerg_yagi.json from NASA GPM IMERG Final Run (GPM_3IMERGHH v07).

Window: 2024-09-07 07:00 UTC (= T0, landfall 14:00 ICT) to 2024-09-10 07:00 UTC, 72 hours.
Download bbox: 100–112°E, 15–25°N. Output (< 400 KB):
  {
    "source": {...},                       # product, DOI, catalog link, host
    "hours": [ISO UTC, 72 entries],        # hour 0 = T0
    "hanoi_mmh": [...],                    # hourly rain at the Hanoi cell (21.03°N, 105.85°E)
    "box_mean_mmh": [...],                 # hourly mean over 103–108°E, 20–23°N (SPEC §6 weights)
    "grid": {"lon0", "lat0", "step", "cols", "rows", "frames": [[row-major mm/h, 1 decimal], ...]}
  }
Grid: lon0/lat0 are the centre of the first column/row; rows go north; frames[h][r * cols + c].

Only the Final Run is used (GPM_3IMERGHH). Early (GPM_3IMERGHHE) and Late (GPM_3IMERGHHL) runs are
rejected. Requires a NASA Earthdata login (earthaccess reads ~/.netrc or EARTHDATA_USERNAME /
EARTHDATA_PASSWORD, or prompts).

Usage:  python data_prep/prepare_imerg.py
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import earthaccess
import h5py
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data_prep" / "raw" / "imerg"
OUT = ROOT / "public" / "data" / "imerg_yagi.json"

SHORT_NAME = "GPM_3IMERGHH"  # Final Run, half-hourly, 0.1°
VERSION = "07"
SOURCE = {
    "product": "GPM_3IMERGHH v07 (Final Run)",
    "doi": "10.5067/GPM/IMERG/3B-HH/07",
    "catalog": "https://data.nasa.gov/dataset/gpm-imerg-final-precipitation-l3-half-hourly-0-1-degree-x-0-1-degree-v07-gpm-3imerghh-at-g-fb698",
    "host": "NASA GES DISC",
}

T0 = datetime(2024, 9, 7, 7, 0, tzinfo=timezone.utc)
HOURS = 72
BBOX = (100.0, 15.0, 112.0, 25.0)  # lon_min, lat_min, lon_max, lat_max
RAIN_BOX = (103.0, 20.0, 108.0, 23.0)
HANOI = (21.03, 105.85)
MAX_BYTES = 400_000


def is_final_run(name: str) -> bool:
    # Final: 3B-HHR.MS.MRG...; Early: 3B-HHR-E...; Late: 3B-HHR-L...
    return name.startswith("3B-HHR.MS.MRG") and "3B-HHR-E" not in name and "3B-HHR-L" not in name


def download() -> list[Path]:
    earthaccess.login()
    results = earthaccess.search_data(
        short_name=SHORT_NAME,
        version=VERSION,
        temporal=(T0.strftime("%Y-%m-%dT%H:%M:%S"), (T0 + timedelta(hours=HOURS, seconds=-1)).strftime("%Y-%m-%dT%H:%M:%S")),
        bounding_box=BBOX,
    )
    if len(results) != HOURS * 2:
        print(f"warning: expected {HOURS * 2} half-hourly granules, found {len(results)}")
    RAW.mkdir(parents=True, exist_ok=True)
    files = [Path(p) for p in earthaccess.download(results, str(RAW))]
    files = sorted(f for f in files if f.suffix.upper() == ".HDF5")
    bad = [f.name for f in files if not is_final_run(f.name)]
    if bad:
        raise SystemExit(f"refusing non-Final-Run granules: {bad[:3]}")
    return files


def read_subset(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return (lon, lat, precip[lat, lon]) inside BBOX, mm/h, NaN for fill values."""
    with h5py.File(path, "r") as f:
        lon = f["Grid/lon"][:]
        lat = f["Grid/lat"][:]
        p = f["Grid/precipitation"][0]  # (lon, lat) in V07
    ix = np.where((lon >= BBOX[0]) & (lon <= BBOX[2]))[0]
    iy = np.where((lat >= BBOX[1]) & (lat <= BBOX[3]))[0]
    sub = p[np.ix_(ix, iy)].T.astype(float)  # → (lat, lon)
    sub[sub < 0] = np.nan
    return lon[ix], lat[iy], sub


def coarsen(lon: np.ndarray, lat: np.ndarray, field: np.ndarray, step: float) -> tuple[list[float], int, int]:
    cols = int(round((BBOX[2] - BBOX[0]) / step))
    rows = int(round((BBOX[3] - BBOX[1]) / step))
    ci = np.clip(((lon - BBOX[0]) // step).astype(int), 0, cols - 1)
    ri = np.clip(((lat - BBOX[1]) // step).astype(int), 0, rows - 1)
    out = []
    for r in range(rows):
        for c in range(cols):
            block = field[np.ix_(ri == r, ci == c)]
            v = np.nanmean(block) if block.size and not np.all(np.isnan(block)) else 0.0
            out.append(round(float(v), 1))
    return out, cols, rows


def main() -> None:
    files = download()
    by_time: dict[datetime, Path] = {}
    for f in files:
        # ...3IMERG.20240907-S070000-E072959...
        stamp = f.name.split(".3IMERG.")[1][:16]
        t = datetime.strptime(stamp, "%Y%m%d-S%H%M%S").replace(tzinfo=timezone.utc)
        by_time[t] = f

    hourly: list[np.ndarray] = []
    lon = lat = None
    for h in range(HOURS):
        t = T0 + timedelta(hours=h)
        halves = [by_time.get(t), by_time.get(t + timedelta(minutes=30))]
        fields = []
        for p in halves:
            if p is None:
                continue
            lon, lat, sub = read_subset(p)
            fields.append(sub)
        if not fields:
            raise SystemExit(f"missing data for hour {t.isoformat()}")
        hourly.append(np.nanmean(np.stack(fields), axis=0))  # mean rate of the two half-hours, mm/h

    assert lon is not None and lat is not None
    hy = int(np.argmin(np.abs(lat - HANOI[0])))
    hx = int(np.argmin(np.abs(lon - HANOI[1])))
    bx = (lon >= RAIN_BOX[0]) & (lon <= RAIN_BOX[2])
    by = (lat >= RAIN_BOX[1]) & (lat <= RAIN_BOX[3])

    doc = {
        "source": SOURCE,
        "hours": [(T0 + timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M:%SZ") for h in range(HOURS)],
        "hanoi_mmh": [round(float(np.nan_to_num(f[hy, hx])), 2) for f in hourly],
        "box_mean_mmh": [round(float(np.nanmean(f[np.ix_(by, bx)])), 3) for f in hourly],
    }

    for step in (0.25, 0.5):
        frames = []
        cols = rows = 0
        for f in hourly:
            vals, cols, rows = coarsen(lon, lat, f, step)
            frames.append(vals)
        doc["grid"] = {
            "lon0": BBOX[0] + step / 2,
            "lat0": BBOX[1] + step / 2,
            "step": step,
            "cols": cols,
            "rows": rows,
            "frames": frames,
        }
        text = json.dumps(doc, separators=(",", ":"))
        if len(text.encode()) <= MAX_BYTES:
            break
        print(f"grid step {step}° gives {len(text) // 1000} KB > {MAX_BYTES // 1000} KB, coarsening")

    OUT.write_text(text, encoding="utf-8")
    peak = max(doc["box_mean_mmh"])
    print(f"wrote {OUT} ({len(text) // 1000} KB), grid {doc['grid']['step']}°, peak box mean {peak} mm/h")
    if not all(math.isfinite(x) for x in doc["box_mean_mmh"]):
        print("warning: NaN in box mean")


if __name__ == "__main__":
    main()
