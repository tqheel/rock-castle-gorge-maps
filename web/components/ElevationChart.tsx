"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Route } from "@/lib/types";

export default function ElevationChart({ route, color }: { route: Route; color: string }) {
  const step = Math.max(1, Math.floor(route.elevFt.length / 200));
  const rows: { dist: number; elev: number }[] = [];
  for (let i = 0; i < route.elevFt.length; i += step) {
    rows.push({ dist: +route.distMi[i].toFixed(2), elev: Math.round(route.elevFt[i]) });
  }
  const last = route.elevFt.length - 1;
  if (rows[rows.length - 1]?.dist !== +route.distMi[last].toFixed(2)) {
    rows.push({ dist: +route.distMi[last].toFixed(2), elev: Math.round(route.elevFt[last]) });
  }
  const yMin = Math.floor((Math.min(...route.elevFt) - 100) / 250) * 250;
  const yMax = Math.ceil((Math.max(...route.elevFt) + 100) / 250) * 250;
  const id = `elev-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="dist" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(v) => `${v} mi`} tick={{ fontSize: 11, fill: "#78716c" }} tickCount={6} />
        <YAxis domain={[yMin, yMax]} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11, fill: "#78716c" }} width={48} />
        <Tooltip
          formatter={(v: number) => [`${v.toLocaleString()} ft`, "Elevation"]}
          labelFormatter={(l: number) => `${l.toFixed(2)} mi`}
          contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e7e5e4" }}
        />
        <Area type="monotone" dataKey="elev" stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
