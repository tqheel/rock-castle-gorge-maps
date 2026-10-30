"use client";

import { useEffect, useRef } from "react";
import type { RouteData } from "@/lib/types";

export type BaseLayer = "topo" | "street";

interface Props {
  data: RouteData;
  selected: string;
  colors: Record<string, string>;
  base: BaseLayer;
  contours: boolean;
}

interface ContourLevel {
  ft: number;
  index: boolean;
  lines: [number, number][][];
}

type Leaflet = typeof import("leaflet");

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function TripMap({ data, selected, colors, base, contours }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const L_ = useRef<Leaflet | null>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const baseLayer = useRef<import("leaflet").TileLayer | null>(null);
  const routeLayer = useRef<import("leaflet").LayerGroup | null>(null);
  const contourLayer = useRef<import("leaflet").LayerGroup | null>(null);
  const contourData = useRef<ContourLevel[] | null>(null);
  const baseRef = useRef(base);
  const contoursRef = useRef(contours);
  baseRef.current = base;
  contoursRef.current = contours;

  const applyBase = () => {
    const L = L_.current, m = map.current;
    if (!L || !m) return;
    baseLayer.current?.remove();
    baseLayer.current =
      baseRef.current === "topo"
        ? L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Map data: <a href='https://www.usgs.gov/programs/national-geospatial-program/national-map'>USGS The National Map</a>",
            maxNativeZoom: 16,
            maxZoom: 18,
          })
        : L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors",
            maxZoom: 17,
          });
    baseLayer.current.addTo(m).bringToBack();
  };

  const applyContours = async () => {
    const L = L_.current, m = map.current;
    if (!L || !m) return;
    contourLayer.current?.remove();
    contourLayer.current = null;
    if (!contoursRef.current) return;
    if (!contourData.current) {
      const res = await fetch(`${BASE_PATH}/data/contours.json`);
      contourData.current = (await res.json()) as ContourLevel[];
    }
    if (!contoursRef.current || !map.current) return;
    const group = L.layerGroup();
    contourData.current.forEach((lvl) => {
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
    group.addTo(m);
    routeLayer.current?.eachLayer((l) => (l as import("leaflet").Path).bringToFront?.());
    contourLayer.current = group;
  };

  // Create the map once.
  useEffect(() => {
    if (!el.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      L_.current = L;
      const m = L.map(el.current, { center: [data.camp.lat, data.camp.lon], zoom: 14 });
      map.current = m;
      applyBase();

      data.loopTrail.forEach((seg) =>
        L.polyline(seg, { color: "#78716c", weight: 2, opacity: 0.5, dashArray: "4 4" }).addTo(m),
      );

      L.circleMarker([data.entry.lat, data.entry.lon], {
        radius: 7, color: "#fff", weight: 2, fillColor: "#1d4ed8", fillOpacity: 1,
      })
        .bindPopup(`<strong>Start / finish (Willis Rd)</strong><br/>${data.entry.elevFt.toLocaleString()} ft`)
        .addTo(m);
      L.circleMarker([data.camp.lat, data.camp.lon], {
        radius: 9, color: "#fff", weight: 2, fillColor: "#dc2626", fillOpacity: 1,
      })
        .bindPopup(
          `<strong>Sites 5-8 (contiguous)</strong><br/>${data.camp.elevFt.toLocaleString()} ft<br/><em>Location approximate: shown at the cluster, not per site</em>`,
        )
        .addTo(m);

      drawRoutes();
      applyContours();
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      L_.current = null;
      baseLayer.current = null;
      routeLayer.current = null;
      contourLayer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const drawRoutes = () => {
    const L = L_.current, m = map.current;
    if (!L || !m) return;
    routeLayer.current?.remove();
    const group = L.layerGroup();
    Object.entries(data.routes).forEach(([key, r]) => {
      const on = key === selected;
      L.polyline(r.track, { color: colors[key] ?? "#555", weight: on ? 5 : 2, opacity: on ? 1 : 0.35 })
        .bindTooltip(`${r.label}: ${r.miles} mi`, { sticky: true })
        .addTo(group);
    });
    group.addTo(m);
    routeLayer.current = group;
    const pts = data.routes[selected]?.track ?? [];
    if (pts.length) m.fitBounds(L.latLngBounds(pts), { padding: [30, 30] });
  };

  useEffect(drawRoutes, [selected, data, colors]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { applyBase(); }, [base]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { applyContours(); }, [contours]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (document.getElementById("leaflet-css")) return;
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }, []);

  return <div ref={el} style={{ height: 480 }} className="w-full rounded-xl overflow-hidden shadow-md border border-stone-200" />;
}
