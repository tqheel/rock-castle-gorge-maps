"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { RouteData } from "@/lib/types";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => <div className="w-full rounded-xl bg-stone-100 animate-pulse" style={{ height: 480 }} />,
});
const ElevationChart = dynamic(() => import("./ElevationChart"), {
  ssr: false,
  loading: () => <div className="w-full rounded-lg bg-stone-100 animate-pulse" style={{ height: 220 }} />,
});

const COLORS: Record<string, string> = {
  entry: "#dc2626",
  saddle: "#2563eb",
  viewpoint: "#16a34a",
  info_center: "#9333ea",
};

const NOTES: Record<string, string> = {
  entry: "Planned route. Same start and finish as the Philmont Crew 618 May Training Trip: off Willis Rd, then Rock Castle Road down the gorge to the camp.",
  saddle: "Alternate: from The Saddle Overlook parking along the ridge trail, then down to camp.",
  viewpoint: "Alternate: from the Rock Castle Gorge Viewpoint parking.",
  info_center: "Alternate: from the Rocky Knob Visitor Center parking.",
};

export default function TripExplorer({ data }: { data: RouteData }) {
  const [sel, setSel] = useState("entry");
  const keys = Object.keys(data.routes);
  const r = data.routes[sel];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setSel(k)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              sel === k ? "text-white border-transparent" : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
            }`}
            style={sel === k ? { backgroundColor: COLORS[k] } : undefined}
          >
            {data.routes[k].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-md">
        {[
          [`${r.miles} mi`, "Hike in"],
          [`+${r.gainFt.toLocaleString()}'`, "Gain"],
          [`-${r.lossFt.toLocaleString()}'`, "Loss"],
        ].map(([v, l]) => (
          <div key={l} className="bg-white rounded-lg border border-stone-200 px-3 py-2 text-center shadow-sm">
            <div className="text-lg font-bold text-forest-800">{v}</div>
            <div className="text-xs text-stone-500">{l}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-stone-600">{NOTES[sel]}</p>

      <TripMap data={data} selected={sel} colors={COLORS} />
      <p className="text-xs text-stone-400 text-center">
        Tiles © OpenStreetMap contributors · Dashed grey line: Rock Castle Gorge Loop Trail · Blue dot: entry point · Red dot: sites 5-8
      </p>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-stone-700 mb-1">Elevation profile</h3>
        <ElevationChart route={r} color={COLORS[sel]} />
      </div>
    </div>
  );
}
