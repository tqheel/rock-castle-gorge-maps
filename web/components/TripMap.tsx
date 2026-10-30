"use client";

import { useEffect, useRef } from "react";
import type { RouteData } from "@/lib/types";

interface Props {
  data: RouteData;
  selected: string;
  colors: Record<string, string>;
}

export default function TripMap({ data, selected, colors }: Props) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { center: [data.camp.lat, data.camp.lon], zoom: 14 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors",
        maxZoom: 17,
      }).addTo(map);

      data.loopTrail.forEach((seg) =>
        L.polyline(seg, { color: "#78716c", weight: 2, opacity: 0.5, dashArray: "4 4" }).addTo(map!),
      );

      Object.entries(data.routes).forEach(([key, r]) => {
        const on = key === selected;
        L.polyline(r.track, {
          color: colors[key] ?? "#555",
          weight: on ? 5 : 2,
          opacity: on ? 1 : 0.35,
        })
          .bindTooltip(`${r.label}: ${r.miles} mi`, { sticky: true })
          .addTo(map!);
      });

      L.circleMarker([data.entry.lat, data.entry.lon], {
        radius: 7, color: "#fff", weight: 2, fillColor: "#1d4ed8", fillOpacity: 1,
      })
        .bindPopup(`<strong>Entry point / parking</strong><br/>${data.entry.elevFt.toLocaleString()} ft`)
        .addTo(map);

      L.circleMarker([data.camp.lat, data.camp.lon], {
        radius: 9, color: "#fff", weight: 2, fillColor: "#dc2626", fillOpacity: 1,
      })
        .bindPopup(
          `<strong>Sites 5-8 (contiguous)</strong><br/>${data.camp.elevFt.toLocaleString()} ft<br/><em>Location approximate: shown at the cluster, not per site</em>`,
        )
        .addTo(map);

      const pts = data.routes[selected]?.track ?? [];
      if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30] });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [data, selected, colors]);

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
