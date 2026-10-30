#!/usr/bin/env python3
"""Generate contour lines from SRTM for the trip area.

Input:  data/N36W081.hgt.gz (SRTM 1 arc-second)
Output: web/public/data/contours.json  [{ft, index, lines: [[[lat, lon], ...], ...]}, ...]

Needs numpy, scipy and contourpy (all installed with matplotlib).
"""
import gzip, json
from pathlib import Path
import numpy as np
from contourpy import contour_generator
from scipy.ndimage import gaussian_filter

REPO = Path(__file__).resolve().parent.parent
BBOX = (36.765, -80.405, 36.835, -80.305)  # south, west, north, east
INTERVAL_FT = 40        # minor contour
INDEX_EVERY = 5         # every 5th line (200 ft) is an index contour
N = 3601

raw = gzip.decompress(open(REPO / "data" / "N36W081.hgt.gz", "rb").read())
dem = np.frombuffer(raw, dtype=">i2").reshape((N, N)).astype(float)
dem[dem == -32768] = np.nan

s, w, n, e = BBOX
r0, r1 = int((37 - n) * (N - 1)), int((37 - s) * (N - 1)) + 1
c0, c1 = int((w + 81) * (N - 1)), int((e + 81) * (N - 1)) + 1
z = gaussian_filter(dem[r0:r1, c0:c1] * 3.28084, sigma=1.2)   # feet, lightly smoothed
lats = 37 - np.arange(r0, r1) / (N - 1)
lons = -81 + np.arange(c0, c1) / (N - 1)

gen = contour_generator(lons, lats, z)
lo = int(np.floor(z.min() / INTERVAL_FT)) * INTERVAL_FT
hi = int(np.ceil(z.max() / INTERVAL_FT)) * INTERVAL_FT
out = []
for ft in range(lo, hi + 1, INTERVAL_FT):
    lines = []
    for seg in gen.lines(ft):
        if len(seg) < 4:
            continue
        seg = seg[::2] if len(seg) > 40 else seg   # thin dense lines
        lines.append([[round(float(y), 5), round(float(x), 5)] for x, y in seg])
    if lines:
        out.append({"ft": ft, "index": (ft // INTERVAL_FT) % INDEX_EVERY == 0, "lines": lines})

dest = REPO / "web" / "public" / "data" / "contours.json"
json.dump(out, open(dest, "w"), separators=(",", ":"))
print(f"{len(out)} levels, {sum(len(o['lines']) for o in out)} lines, {dest.stat().st_size // 1024} KB, {lo}-{hi} ft")
