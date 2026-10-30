#!/usr/bin/env python3
"""Build route graph, shortest paths and elevation profiles for the Rock Castle Gorge site.

Inputs:  data/osm_paths.json, data/osm_raw.json (OpenStreetMap via Overpass, (c) OSM contributors, ODbL)
         data/N36W081.hgt.gz (SRTM 1 arc-second, AWS terrain tiles)
Output:  web/public/data/route.json
"""
import gzip, heapq, json, math
from pathlib import Path
import numpy as np

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "data"
OUT = REPO / "web" / "public" / "data"

ENTRY = (36.774934, -80.390554)   # Willis Rd start/stop (Philmont Crew 618 May Training Trip end point, Nov 2026 start and end)
CAMP = (36.806365, -80.336924)    # Philmont Crew 618 May Training Trip: camp sites (contiguous)

def hv(a, b):
    R = 6371000.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def key(lat, lon):
    return (round(lat, 6), round(lon, 6))

# ---- graph ----
ways = {}
for f in ("osm_paths.json", "osm_raw.json"):
    for e in json.load(open(DATA / f))["elements"]:
        if e["type"] == "way" and e["tags"].get("highway") in ("path", "footway", "steps", "track"):
            if e["tags"].get("name") == "Private Property":
                continue
            ways[e["id"]] = [key(g["lat"], g["lon"]) for g in e["geometry"]]
adj = {}
for pts in ways.values():
    for a, b in zip(pts, pts[1:]):
        d = hv(a, b)
        adj.setdefault(a, []).append((b, d))
        adj.setdefault(b, []).append((a, d))
nodes = list(adj)

def snap(p):
    return min(nodes, key=lambda n: hv(n, p))

def dijkstra(src):
    dist, prev, pq = {src: 0.0}, {}, [(0.0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist.get(v, 1e18):
                dist[v], prev[v] = nd, u
                heapq.heappush(pq, (nd, v))
    return dist, prev

def path_to(prev, dst):
    out = [dst]
    while out[-1] in prev:
        out.append(prev[out[-1]])
    return out[::-1]

# ---- elevation ----
raw = gzip.decompress(open(DATA / "N36W081.hgt.gz", "rb").read())
N = 3601
dem = np.frombuffer(raw, dtype=">i2").reshape((N, N)).astype(float)
dem[dem == -32768] = np.nan

def elev_ft(lat, lon):
    r = (37 - lat) * (N - 1)
    c = (lon + 81) * (N - 1)
    r0, c0 = int(r), int(c)
    fr, fc = r - r0, c - c0
    z = (dem[r0, c0] * (1 - fr) * (1 - fc) + dem[r0, c0 + 1] * (1 - fr) * fc
         + dem[r0 + 1, c0] * fr * (1 - fc) + dem[r0 + 1, c0 + 1] * fr * fc)
    return float(z) * 3.28084

def profile(pts):
    dist, cum, el = 0.0, [], []
    for i, p in enumerate(pts):
        if i:
            dist += hv(pts[i - 1], p)
        cum.append(round(dist / 1609.344, 3))
        el.append(round(elev_ft(*p), 1))
    # light smoothing (5-point moving average) to suppress SRTM noise
    sm = [round(float(np.mean(el[max(0, i - 2):i + 3])), 1) for i in range(len(el))]
    gain = sum(max(0, b - a) for a, b in zip(sm, sm[1:]))
    loss = sum(max(0, a - b) for a, b in zip(sm, sm[1:]))
    return {"track": [[p[0], p[1]] for p in pts], "distMi": cum, "elevFt": sm,
            "miles": round(cum[-1], 2), "gainFt": round(gain), "lossFt": round(loss)}

# ---- start points ----
STARTS = {
    "entry": ("Willis Rd start (same as Philmont Crew 618 May Training Trip)", ENTRY),
    "info_center": ("Rocky Knob Visitor Center parking", (36.8103, -80.3501)),
    "viewpoint": ("Rock Castle Gorge Viewpoint parking", (36.8121, -80.3462)),
    "saddle": ("The Saddle Overlook parking", (36.8232, -80.3419)),
}
camp_n = snap(CAMP)
print("camp snapped", round(hv(camp_n, CAMP)), "m from the camp coordinate")
routes = {}
for k, (label, p) in STARTS.items():
    s = snap(p)
    dist, prev = dijkstra(s)
    if camp_n not in dist:
        print(k, "no path"); continue
    pts = path_to(prev, camp_n)
    if hv(s, p) > 10:
        pts = [key(*p)] + pts  # connect the unmapped stretch from the real start point
    r = profile(pts)
    r.update({"label": label, "startSnapM": round(hv(s, p))})
    routes[k] = r
    print(f"{k:12s} {r['miles']:5.2f} mi  +{r['gainFt']} / -{r['lossFt']} ft  snap {r['startSnapM']} m")

# ---- context: whole OSM loop trail ----
loop = []
for e in json.load(open(DATA / "osm_raw.json"))["elements"]:
    if e["type"] == "way" and e["tags"].get("name") == "Rock Castle Gorge Loop Trail":
        loop.append([[g["lat"], g["lon"]] for g in e["geometry"]])

out = {"camp": {"lat": CAMP[0], "lon": CAMP[1], "elevFt": round(elev_ft(*CAMP)),
                "snappedM": round(hv(camp_n, CAMP))},
       "entry": {"lat": ENTRY[0], "lon": ENTRY[1], "elevFt": round(elev_ft(*ENTRY))},
       "routes": routes, "loopTrail": loop}
OUT.mkdir(parents=True, exist_ok=True)
json.dump(out, open(OUT / "route.json", "w"), separators=(",", ":"))
print("wrote", OUT / "route.json")
