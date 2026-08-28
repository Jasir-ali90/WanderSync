import { useState } from "react";
import { RotateCcw, Sparkles, MapPin } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { Trip } from "@/types/api";

/** Curated destination -> Unsplash image map, matched by keyword so the
 *  preview always shows the destination the user actually planned. */
const DESTINATION_IMAGES: Record<string, string> = {
  tokyo: "photo-1540959733332-eab4deabeeaf",
  kyoto: "photo-1478436127897-769e1b3f0f36",
  osaka: "photo-1565967511849-76a60a516170",
  hokkaido: "photo-1503899036084-c55cdd92da26",
  japan: "photo-1490806843957-31f4c9a91c65",
  paris: "photo-1502602898657-3e91760cbb34",
  france: "photo-1502602898657-3e91760cbb34",
  london: "photo-1513635269975-59663e0ac1ad",
  "united kingdom": "photo-1486299267070-83823f5448dd",
  rome: "photo-1552832230-c0197dd311b5",
  italy: "photo-1523906834658-6e24ef2386f9",
  venice: "photo-1514890547357-a9ee288728e0",
  milan: "photo-1520106212299-d99c443e4568",
  dubai: "photo-1512453979798-5ea266f8880c",
  "abu dhabi": "photo-1566198826866-3cb35d78da7d",
  uae: "photo-1512453979798-5ea266f8880c",
  "united arab emirates": "photo-1512453979798-5ea266f8880c",
  makkah: "photo-1565092414099-1f1fca0b5a27",
  madinah: "photo-1591604129939-f1efa4d9f7fa",
  medina: "photo-1591604129939-f1efa4d9f7fa",
  "saudi arabia": "photo-1528323273322-d81458248d40",
  istanbul: "photo-1544984243-ec57ea16bb25",
  turkey: "photo-1524231757912-21f4fe3a7200",
  cappadocia: "photo-1580655653885-65763b2597d0",
  bali: "photo-1537996194471-e657df975ab4",
  indonesia: "photo-1518548419970-58e3b4079ab2",
  bangkok: "photo-1508009603885-50cf7c579365",
  thailand: "photo-1552465011-b4e21bf6e79a",
  maldives: "photo-1514282401047-d79a71a590e8",
  "new york": "photo-1496442226666-8d4d0e62e6e9",
  "los angeles": "photo-1501594907352-04cda38ebc29",
  switzerland: "photo-1531366936337-7c912a4589a7",
  zurich: "photo-1513309772886-e1410412ce5a",
  geneva: "photo-1533105079780-92b9be482077",
  sydney: "photo-1506973035872-a4ec16b8e8d9",
  cairo: "photo-1503177119275-0aa32b3a9368",
  egypt: "photo-1568322445389-f64ac2515020",
  hunza: "photo-1532029837206-abbe2b7620e3",
  gilgit: "photo-1532029837206-abbe2b7620e3",
  karachi: "photo-1601134467661-3d775b999c8b",
  lahore: "photo-1587474260584-136574528ed5",
  islamabad: "photo-1587583215381-79bc4f4c0f0c",
  pakistan: "photo-1587575494201-11fe74d90d6d",
  goa: "photo-1512343879784-a960bf40e7f2",
  india: "photo-1524492412937-b28074a5d7da",
  santorini: "photo-1613395877344-13d4a8e0d49e",
  greece: "photo-1570077188670-e3a8d69ac5ff",
  "machu picchu": "photo-1526392060635-9d6019884377",
  malaysia: "photo-1596422846543-75c6fc197f07",
  singapore: "photo-1525625293386-3f8f99389edd",
  korea: "photo-1517154421773-0529f29ea451",
};

const FALLBACK_IMAGE = "photo-1488646953014-85cb44e25828";

function destinationImage(destination: string): string {
  const key = (destination || "").trim().toLowerCase();
  for (const [keyword, image] of Object.entries(DESTINATION_IMAGES)) {
    if (key.includes(keyword)) return image;
  }
  return FALLBACK_IMAGE;
}

interface SimulationStep {
  day: number;
  title: string;
  location: string;
  activity: string;
  image: string;
}
export function TripSimulationModal({ trip, onClose }: { trip?: Trip; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const destination = trip?.destination || "Your Destination";
  const mainImage = destinationImage(destination);
  const days = trip?.itinerary.days ?? [];

  const steps: SimulationStep[] =
    days.length > 0
      ? days.slice(0, 6).map((day) => {
          const first = day.activities[0];
          const names = day.activities
            .slice(0, 2)
            .map((a) => a.name)
            .join(" · ");
          return {
            day: day.day_number,
            title: day.title || `Day ${day.day_number} in ${destination}`,
            location: first?.location || destination,
            activity: names || "A relaxed day of discovery",
            image: mainImage,
          };
        })
      : [
          {
            day: 1,
            title: `Arrival in ${destination}`,
            location: destination,
            activity: "Your WanderSync itinerary starts here",
            image: mainImage,
          },
        ];

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl space-y-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Experience My Trip</h3>
              <p className="text-xs text-slate-500">
                A cinematic preview of your {destination} itinerary.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
          <img
            src={`https://images.unsplash.com/${step.image}?auto=format&fit=crop&w=1000&q=80`}
            alt={step.title}
            className="h-full w-full scale-105 object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 space-y-1">
            <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Day {step.day} preview
            </span>
            <h4 className="text-xl font-extrabold text-white">{step.title}</h4>
            <p className="flex items-center gap-1 text-xs text-blue-100">
              <MapPin className="size-3.5" /> {step.location} — {step.activity}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {steps.map((s, idx) => (
              <button
                key={s.day}
                onClick={() => setCurrentStep(idx)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  currentStep === idx
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                Day {s.day}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setCurrentStep((prev) => (prev + 1) % steps.length)} className="rounded-lg">
              Next Day →
            </Button>
            <Button size="sm" onClick={() => setCurrentStep(0)} className="rounded-lg">
              <RotateCcw className="mr-1 size-3.5" /> Replay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}