import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Troop 212 · Rock Castle Gorge",
  description: "Backpacking skills trip · Nov 7-8, 2026 · Rock Castle Gorge Backcountry Camping, Blue Ridge Parkway",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        <header className="bg-forest-800 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">⛺</span>
            <div>
              <div className="font-bold text-lg leading-tight">Troop 212 · Rock Castle Gorge</div>
              <div className="text-xs text-green-200 leading-tight">Backpacking skills trip · Nov 7-8, 2026</div>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-stone-200 mt-12 py-6 text-center text-xs text-stone-400">
          Troop 212 · Route from OpenStreetMap trail data and SRTM elevation. Planning aid only: verify with the NPS
          and carry the official map.
        </footer>
      </body>
    </html>
  );
}
