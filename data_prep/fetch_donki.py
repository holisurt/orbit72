"""Fetch the strongest 2024 geomagnetic storm from NASA DONKI (GST) → public/data/donki_gst.json.

Shown on the E1 event card ("Bão Mặt Trời mạnh"). Standard library only.
API key: env NASA_API_KEY (defaults to DEMO_KEY, rate-limited).

Usage:  python data_prep/fetch_donki.py
"""
from __future__ import annotations

import calendar
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "donki_gst.json"
API = "https://api.nasa.gov/DONKI/GST"


def fetch_month(key: str, year: int, month: int) -> list[dict]:
    # The API rejects long ranges (HTTP 400), so ask one month at a time.
    last = calendar.monthrange(year, month)[1]
    query = urllib.parse.urlencode(
        {"startDate": f"{year}-{month:02d}-01", "endDate": f"{year}-{month:02d}-{last:02d}", "api_key": key}
    )
    req = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": "orbit72-data-prep"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read()
            return json.loads(body) if body.strip() else []
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 3:
                raise
            wait = 30 * (attempt + 1)
            print(f"rate-limited (429), waiting {wait} s — set NASA_API_KEY to avoid DEMO_KEY limits")
            time.sleep(wait)
    return []


def main() -> None:
    key = os.environ.get("NASA_API_KEY", "DEMO_KEY")
    storms: list[dict] = []
    for month in range(1, 13):
        storms += fetch_month(key, 2024, month)

    best = None
    for s in storms:
        for k in s.get("allKpIndex") or []:
            kp = k.get("kpIndex")
            if kp is None:
                continue
            if best is None or kp > best["kpIndex"]:
                best = {
                    "gstID": s.get("gstID"),
                    "startTime": s.get("startTime"),
                    "kpIndex": kp,
                    "observedTime": k.get("observedTime"),
                    "link": s.get("link"),
                    "source": "NASA DONKI (CCMC) · GST",
                }
    if best is None:
        raise SystemExit("no GST records with Kp found for 2024")
    OUT.write_text(json.dumps(best, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {OUT}: {best['startTime']} Kp {best['kpIndex']} ({len(storms)} storms in 2024)")


if __name__ == "__main__":
    main()
