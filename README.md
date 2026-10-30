# Rock Castle Gorge maps (Troop 212, Nov 7-8, 2026)

Static trip site modeled on `philmont-maps`: route options, elevation profile, camp info and open items for the
Rock Castle Gorge backcountry sites 5-8 (Rocky Knob, Blue Ridge Parkway, VA).

## Data
- Trails and parking: OpenStreetMap via Overpass (c) OpenStreetMap contributors, ODbL. Saved to `data/osm_*.json` (ignored by git).
- Elevation: SRTM 1 arc-second tile N36W081 from the AWS terrain tiles (`data/N36W081.hgt.gz`, ignored by git).
- Entry point and camp coordinates: from the Philmont Crew 618 May Training Trip (hard-coded in `scripts/build_route.py`).
  The camp coordinate is the cluster of contiguous sites 5-8, not each site.

## Build
```
python3 scripts/build_route.py          # writes web/public/data/route.json
cd web && npm install && npm run dev    # http://localhost:3001
GITHUB_PAGES=true npm run build         # static export to web/out
```

## Not included on purpose
No names, rosters, reservation or order numbers, payment details, vehicle info or emergency contacts.
Routes are computed from OSM paths, not surveyed. Verify with the NPS before relying on them.
