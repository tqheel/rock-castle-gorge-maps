import type { RouteData } from "@/lib/types";
import rawRoute from "@/public/data/route.json";
import TripExplorer from "@/components/TripExplorer";

const data = rawRoute as unknown as RouteData;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
      <h2 className="text-base font-semibold text-forest-700 mb-2">{title}</h2>
      <div className="text-sm text-stone-700 space-y-1.5">{children}</div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 mb-1">Backpacking Skills Trip</h1>
        <p className="text-stone-500 text-sm">
          Sat Nov 7 to Sun Nov 8, 2026 · one night · Rock Castle Gorge Backcountry Camping, Rocky Knob, Blue Ridge Parkway, VA
        </p>
      </div>

      <TripExplorer data={data} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Schedule (draft)">
          <p className="font-semibold text-stone-800">Saturday, Nov 7</p>
          <ul className="space-y-1">
            <li><strong>8:00 AM</strong> Muster at Wegmans, 3710 Davis Dr, Morrisville, NC. Arrive with full bellies.</li>
            <li><strong>8:30 AM</strong> Depart for the Rock Castle Gorge West Trailhead, Rock Castle Rd, Floyd, VA. Optional stop: Bojangles, 6820 NC-135, Mayodan, NC.</li>
            <li><strong>~11:30 AM</strong> Arrive at the trailhead.</li>
            <li><strong>12:00 PM</strong> Start the hike in to the campsites (about 3.8 miles). Lunch on the trail.</li>
            <li>Backpacking meals at camp.</li>
          </ul>
          <p className="font-semibold text-stone-800 pt-2">Sunday, Nov 8</p>
          <ul className="space-y-1">
            <li><strong>6:30 AM</strong> Wake up.</li>
            <li><strong>8:00 AM</strong> Hike out (about 3.8 miles). Check-out is noon.</li>
            <li>Lunch stop at Bojangles, Mayodan, NC on the way home.</li>
            <li><strong>~4:00 PM</strong> Back at Wegmans. Could be earlier; the plan assumes 1 mile per hour. Times and miles are planning estimates.</li>
          </ul>
          <p className="text-stone-500 pt-2">Draft from the leadership team. The grub plan may change with the new itinerary. Camp check-in is 3 PM.</p>
        </Card>
        <Card title="Camp">
          <p>Sites 5, 6, 7 and 8, side by side. Primitive hike-in sites, $15 per site.</p>
          <p>Fire only in the provided grill, dead and down wood only. Bear box at each site, portable toilet nearby. Nights drop below freezing. Cell service is unreliable.</p>
          <p><strong>Water:</strong> there are no taps at the sites, but there is plenty of natural water at camp and along the hike. Scouts filter or chemically treat it and refill their bottles, which is part of the trip program. Each Scout brings at least one Nalgene, and leaders bring backcountry filters.</p>
        </Card>
      </div>
    </div>
  );
}
