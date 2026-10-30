import type { Metadata } from "next";
import type { RouteData } from "@/lib/types";
import rawRoute from "@/public/data/route.json";
import PrintView from "@/components/PrintView";

export const metadata: Metadata = { title: "Printable map · Troop 212 Rock Castle Gorge" };

export default function PrintPage() {
  return <PrintView data={rawRoute as unknown as RouteData} />;
}
