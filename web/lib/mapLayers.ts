import type * as Leaflet from "leaflet";

export type BaseLayer = "topo" | "street";

export interface ContourLevel {
  ft: number;
  index: boolean;
  lines: [number, number][][];
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function baseTileLayer(L: typeof Leaflet, base: BaseLayer): Leaflet.TileLayer {
  return base === "topo"
    ? L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", {
        attribution:
          "Map data: <a href='https://www.usgs.gov/programs/national-geospatial-program/national-map'>USGS The National Map</a>",
        maxNativeZoom: 16,
        maxZoom: 18,
      })
    : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors",
        maxZoom: 17,
      });
}

let contourCache: ContourLevel[] | null = null;

export async function loadContours(): Promise<ContourLevel[]> {
  if (!contourCache) {
    const res = await fetch(`${BASE_PATH}/data/contours.json`);
    contourCache = (await res.json()) as ContourLevel[];
  }
  return contourCache;
}

export function contourGroup(L: typeof Leaflet, levels: ContourLevel[]): Leaflet.LayerGroup {
  const group = L.layerGroup();
  levels.forEach((lvl) => {
    lvl.lines.forEach((line) => {
      L.polyline(line, {
        color: "#8b5a2b",
        weight: lvl.index ? 1.4 : 0.7,
        opacity: lvl.index ? 0.9 : 0.6,
        interactive: lvl.index,
      })
        .bindTooltip(`${lvl.ft.toLocaleString()} ft`, { sticky: true })
        .addTo(group);
      if (lvl.index && line.length >= 40) {
        const [lat, lon] = line[Math.floor(line.length / 2)];
        L.marker([lat, lon], {
          interactive: false,
          icon: L.divIcon({
            className: "",
            html: `<span style="font:600 10px system-ui;color:#6b4423;background:rgba(255,255,255,.75);padding:0 2px;border-radius:2px;white-space:nowrap">${lvl.ft.toLocaleString()}</span>`,
            iconSize: [0, 0],
          }),
        }).addTo(group);
      }
    });
  });
  return group;
}
