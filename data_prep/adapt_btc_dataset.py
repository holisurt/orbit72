"""Stub: adapt the organisers' (BTC) dataset into ORBIT 72 JSON.

The challenge Resources tab provides methodology and tools, not a numeric dataset
(see data_prep/BTC_DATASET.md), so there is nothing to convert today.

If a numeric dataset is published later, map it into the existing schemas instead of adding new ones:
  - rainfall time series  → public/data/imerg_yagi.json  (hours, hanoi_mmh, box_mean_mmh, grid)
  - space-weather events  → public/data/donki_gst.json   (startTime, kpIndex, link)
  - component parameters  → public/data/components.json  (keep provenance tags)
"""


def main() -> None:
    print("No numeric BTC dataset to adapt — see data_prep/BTC_DATASET.md.")


if __name__ == "__main__":
    main()
