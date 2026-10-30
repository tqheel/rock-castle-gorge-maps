"use client";

import { useEffect, useRef } from "react";
import type { RouteData } from "@/lib/types";
import { baseTileLayer, contourGroup, loadContours, type BaseLayer } from "@/lib/mapLayers";

interface Props {
  data: RouteData;
  letters: Record<string, string>;
  colors: Record<string, string>;
  planned: string;
  base: BaseLayer;
  contours: boolean;
}

type Leaflet = typeof import("leaflet");

const RETICLE = `
<svg width="96" height="96" viewBox="-48 -48 96 96" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
    <circle r="30"/><path d="M0-46V-14M0 14V46M-46 0H-14M14 0H46"/>
  </g>
  <g fill="none" stroke="#b91c1c" stroke-width="3" stroke-linecap="round">
    <circle r="30"/><path d="M0-46V-14M0 14V46M-46 0H-14M14 0H46"/>
  </g>
</svg>`;

export default function PrintMap({ data, letters, colors, planned, base, contours }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const L_ = useRef<Leaflet | null>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const baseLayer = useRef<import("leaflet").TileLayer | null>(null);
  const contourLayer = useRef<import("leaflet").LayerGroup | null>(null);
  const contoursRef = useRef(contours);
  contoursRef.current = contours;

  // Create the map once.
  useEffect(() => {
    if (!el.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      L_.current = L;
      const m = L.map(el.current, { zoomSnap: 0.5, zoomDelta: 0.5, preferCanvas: false });
      map.current = m;

      // Alternates first, planned route last so it sits on top.
      const keys = Object.keys(data.routes).sort((a, b) => (a === planned ? 1 : b === planned ? -1 : 0));
      const all: [number, number][] = [[data.camp.lat, data.camp.lon]];
      keys.forEach((k) => {
        const r = data.routes[k];
        const isPlanned = k === planned;
        L.polyline(r.track, {
          color: colors[k],
          weight: isPlanned ? 6 : 4,
          opacity: 0.95,
          dashArray: isPlanned ? undefined : "10 6",
        }).addTo(m);
        all.push(...r.track);

        const [lat, lon] = r.track[0];
        L.marker([lat, lon], {
          interactive: false,
          icon: L.divIcon({
            className: "",
            iconSize: [26, 26],
            iconAnchor: [13, 13],
            html: `<div style="width:26px;height:26px;border-radius:50%;background:${colors[k]};color:#fff;border:2px solid #fff;box-shadow:0 0 0 1.5px #1c1917;font:700 14px/22px system-ui;text-align:center">${letters[k]}</div>`,
          }),
        }).addTo(m);
      });

      // Reticle around the camp sites, with a label.
      L.marker([data.camp.lat, data.camp.lon], {
        interactive: false,
        icon: L.divIcon({ className: "", html: RETICLE, iconSize: [96, 96], iconAnchor: [48, 48] }),
      }).addTo(m);
      L.marker([data.camp.lat, data.camp.lon], {
        interactive: false,
        icon: L.divIcon({
          className: "",
          iconSize: [0, 0],
          html: `<div style="position:absolute;left:36px;top:-34px;white-space:nowrap;font:700 13px/1.15 system-ui;color:#7f1d1d;background:rgba(255,255,255,.9);border:1.5px solid #b91c1c;border-radius:4px;padding:2px 6px">CAMP<br/>Sites 5-8</div>`,
        }),
      }).addTo(m);

      L.control.scale({ imperial: true, metric: false, position: "bottomleft" }).addTo(m);
      m.fitBounds(L.latLngBounds(all), { padding: [60, 60] });
      baseLayer.current = baseTileLayer(L, base).addTo(m);
      baseLayer.current.bringToBack();
      applyContours();
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      L_.current = null;
      baseLayer.current = null;
      contourLayer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const applyContours = async () => {
    const L = L_.current, m = map.current;
    if (!L || !m) return;
    contourLayer.current?.remove();
    contourLayer.current = null;
    if (!contoursRef.current) return;
    const levels = await loadContours();
    if (!contoursRef.current || !map.current) return;
    contourLayer.current = contourGroup(L, levels).addTo(m);
    contourLayer.current.eachLayer((l) => (l as import("leaflet").Path).bringToBack?.());
    baseLayer.current?.bringToBack();
  };

  useEffect(() => {
    const L = L_.current, m = map.current;
    if (!L || !m) return;
    baseLayer.current?.remove();
    baseLayer.current = baseTileLayer(L, base).addTo(m);
    baseLayer.current.bringToBack();
  }, [base]);

  useEffect(() => { applyContours(); }, [contours]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (document.getElementById("leaflet-css")) return;
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }, []);

  return (
    <div className="relative" style={{ width: "7.5in", height: "6.9in" }}>
      <div ref={el} className="w-full h-full border-2 border-stone-800" />
      <svg
        className="absolute top-3 right-3 z-[1000] pointer-events-none"
        width="36" height="52" viewBox="0 0 36 52" aria-label="North"
      >
        <rect x="0" y="0" width="36" height="52" rx="4" fill="#fff" fillOpacity="0.85" />
        <path d="M18 8 L28 38 L18 31 L8 38 Z" fill="#1c1917" />
        <text x="18" y="50" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="system-ui" fill="#1c1917">N</text>
      </svg>
    </div>
  );
}
