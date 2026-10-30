"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { RouteData } from "@/lib/types";
import type { BaseLayer } from "@/lib/mapLayers";

const PrintMap = dynamic(() => import("./PrintMap"), {
  ssr: false,
  loading: () => <div className="bg-stone-100 animate-pulse" style={{ width: "7.5in", height: "6.9in" }} />,
});

const COLORS: Record<string, string> = {
  entry: "#dc2626",
  saddle: "#2563eb",
  viewpoint: "#16a34a",
  info_center: "#9333ea",
};
const LETTERS: Record<string, string> = { entry: "A", saddle: "B", viewpoint: "C", info_center: "D" };

export default function PrintView({ data }: { data: RouteData }) {
  const [base, setBase] = useState<BaseLayer>("topo");
  const [contours, setContours] = useState(false);
  const keys = Object.keys(data.routes);

  return (
    <div className="print-page">
      <div className="print:hidden mb-4 space-y-2 max-w-[7.5in]">
        <Link href="/" className="inline-block text-sm text-forest-700 underline hover:text-forest-800">
          ← Back to the interactive trip map
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-700">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded-lg bg-forest-800 text-white text-sm font-medium hover:bg-forest-700"
          >
            Print
          </button>
          <span className="font-medium text-stone-500">Map</span>
          {([["topo", "USGS Topo"], ["street", "Street"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="pbase" checked={base === k} onChange={() => setBase(k)} />
              {label}
            </label>
          ))}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={contours} onChange={(e) => setContours(e.target.checked)} />
            Contour lines
          </label>
        </div>
        <p className="text-xs text-stone-500">
          Pan and zoom the map to frame it, then print. In the print dialog choose Letter, portrait, margins
          Default or None, and turn on Background graphics so the route colors print.
        </p>
      </div>

      <div style={{ width: "7.5in" }} className="text-stone-900">
        <div className="flex items-baseline justify-between border-b-2 border-stone-800 pb-1 mb-2">
          <h1 className="text-xl font-bold">Troop 212 · Rock Castle Gorge</h1>
          <div className="text-sm font-medium">Backpacking skills trip · Nov 7-8, 2026</div>
        </div>

        <PrintMap data={data} letters={LETTERS} colors={COLORS} planned="entry" base={base} contours={contours} />

        <table className="w-full text-xs mt-3 border-collapse">
          <thead>
            <tr className="text-left border-b border-stone-400">
              <th className="py-1 w-8"></th>
              <th className="py-1">Route to camp</th>
              <th className="py-1 text-right">Miles</th>
              <th className="py-1 text-right">Climb</th>
              <th className="py-1 text-right">Descent</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const r = data.routes[k];
              return (
                <tr key={k} className="border-b border-stone-200">
                  <td className="py-1">
                    <span
                      className="inline-block w-5 h-5 rounded-full text-white text-center font-bold leading-5"
                      style={{ backgroundColor: COLORS[k], printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
                    >
                      {LETTERS[k]}
                    </span>
                  </td>
                  <td className="py-1">
                    {r.label}
                    {k === "entry" && <strong> (planned route, solid line)</strong>}
                    {k !== "entry" && <span className="text-stone-500"> (alternate, dashed)</span>}
                  </td>
                  <td className="py-1 text-right">{r.miles}</td>
                  <td className="py-1 text-right">+{r.gainFt.toLocaleString()} ft</td>
                  <td className="py-1 text-right">-{r.lossFt.toLocaleString()} ft</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="font-semibold">Camp: sites 5, 6, 7, 8 (side by side)</div>
            <div>{data.camp.lat.toFixed(5)}, {data.camp.lon.toFixed(5)} · {data.camp.elevFt.toLocaleString()} ft</div>
            <div className="font-semibold mt-1">Start / finish: Willis Rd</div>
            <div>{data.entry.lat.toFixed(5)}, {data.entry.lon.toFixed(5)} · {data.entry.elevFt.toLocaleString()} ft</div>
          </div>
          <div>
            <div className="font-semibold">Water</div>
            <div>No taps. Filter or treat water from the creek and refill bottles.</div>
            <div className="font-semibold mt-1">Stay together</div>
            <div>Buddy system. Stay with your patrol and leaders.</div>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-stone-500 leading-snug">
          Planning aid only. Routes are computed from OpenStreetMap trails and SRTM elevation, not surveyed, and the
          camp marker shows the cluster of sites, not each site. Map data: USGS The National Map, © OpenStreetMap
          contributors. Contours (if shown): SRTM, 40 ft.
        </p>
      </div>
    </div>
  );
}
