/** Landing showcase: 3D famous-spots carousel + season recommendations. */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";

import { Card, SectionTitle, Spinner } from "@/components/ui/Card";
import { api } from "@/lib/api";

interface Spot {
  name: string;
  city: string;
  country?: string;
  emoji: string;
  lat: number;
  lon: number;
  description: string;
}

interface CountryBlock {
  country: string;
  code: string;
  tagline: string;
  spots: Spot[];
}

/* Curated destination photography (Unsplash) — keyed by spot name. */
const SPOT_IMAGES: Record<string, string> = {
  colosseum: "photo-1552832230-c0197dd311b5",
  "venice canals": "photo-1514890547357-a9ee288728e0",
  "leaning tower of pisa": "photo-1572441712941-9e5d83e5b6eb",
  "eiffel tower": "photo-1502602898657-3e91760cbb34",
  "louvre museum": "photo-1499856871958-5b9627545d1a",
  "palace of versailles": "photo-1585724742666-c1ad1f23b7e2",
  "mount fuji": "photo-1490806843957-31f4c9a91c65",
  "fushimi inari shrine": "photo-1478436127897-769e1b3f0f36",
  "shibuya crossing": "photo-1542051841857-5f90071e7989",
  "hagia sophia": "photo-1544984243-ec57ea16bb25",
  "cappadocia balloons": "photo-1580655653885-65763b2597d0",
  "pamukkale terraces": "photo-1571041100634-a4f185456d70",
  "burj khalifa": "photo-1512453979798-5ea266f8880c",
  "sheikh zayed mosque": "photo-1566198826866-3cb35d78da7d",
  "desert safari dunes": "photo-1451337516015-6b6e9a44a8a3",
  "petronas twin towers": "photo-1596422846543-75c6fc197f07",
  "batu caves": "photo-1610123593628-5f5c5ef36ed6",
  "langkawi sky bridge": "photo-1588776332024-7f0f7d2f9f4d",
  "pyramids of giza": "photo-1503177119275-0aa32b3a9368",
  "luxor temple": "photo-1568322445389-f64ac2515020",
  "red sea riviera": "photo-1544551763-46a013bb70d5",
  matterhorn: "photo-1464278533981-50106e6176b1",
  "lake geneva": "photo-1533105079780-92b9be482077",
  jungfraujoch: "photo-1531366936337-7c912a4589a7",
  "taj mahal": "photo-1564507592333-c60657eea523",
  "santorini": "photo-1570077188670-e3a8d69ac5ff",
  "machu picchu": "photo-1526392060635-9d6019884377",
  "great wall of china": "photo-1508804185872-d7badad00f7d",
};

function spotImage(spot: Spot): string {
  const nameLower = spot.name.toLowerCase();
  const cityLower = spot.city.toLowerCase();

  // Find matching key in dictionary
  const matchedKey = Object.keys(SPOT_IMAGES).find(
    (k) => nameLower.includes(k) || k.includes(nameLower) || cityLower.includes(k),
  );

  const id = matchedKey ? SPOT_IMAGES[matchedKey] : "photo-1488646953014-85cb44e25828";
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
}

/* ------------------------------ 3D Carousel ------------------------------ */

export function SpotsCarousel() {
  const catalog = useQuery({
    queryKey: ["spots-catalog"],
    queryFn: () => api.get<{ count: number; countries: CountryBlock[] }>("/spots/"),
    staleTime: 10 * 60_000,
  });

  if (catalog.isLoading) return <Spinner label="Loading world wonders…" />;
  const countryBlocks = catalog.data?.countries;
  if (!countryBlocks?.length) return null;

  const spots = countryBlocks.flatMap((block) =>
    block.spots.map((spot) => ({ ...spot, country: block.country })),
  );

  return (
    <section
      id="spots"
      className="bg-radial-teal relative overflow-hidden px-4 py-20 sm:px-6"
      aria-labelledby="carousel-heading"
    >
      <SectionTitle
        eyebrow="3D Famous Destinations"
        title="Explore Iconic Global Spots"
        subtitle="Hover over any spot card to experience smooth 3D tilt effects. Click 'Plan Trip Here' to instantly build your custom AI itinerary."
      />
      <CarouselTrack spots={spots} />
    </section>
  );
}

function CarouselTrack({ spots }: { spots: Spot[] }) {
  const reduceMotion = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused || !scrollerRef.current) return;
    let frame: number;
    const step = () => {
      const el = scrollerRef.current;
      if (el) {
        el.scrollLeft += 0.8;
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, paused]);

  return (
    <div
      ref={scrollerRef}
      className="[perspective:1200px] mt-10 flex gap-6 overflow-x-auto px-[6vw] pb-8 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Famous destinations carousel"
    >
      {[...spots, ...spots].map((spot, index) => (
        <SpotCard key={`${spot.name}-${index}`} spot={spot} />
      ))}
    </div>
  );
}

/** Tilt-toward-cursor card with parallax layers & CTA. */
function SpotCard({ spot }: { spot: Spot }) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const img = spotImage(spot);

  const onMove = (event: React.MouseEvent) => {
    if (reduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -16, y: px * 18 });
  };

  const style: CSSProperties = {
    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(24px)`,
    transition: tilt.x === 0 && tilt.y === 0 ? "transform .6s ease" : "transform .08s linear",
    transformStyle: "preserve-3d",
  };

  return (
    <div className="[perspective:900px] shrink-0">
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={style}
        className="group relative h-84 w-68 h-[22rem] w-64 overflow-hidden rounded-3xl border border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-md"
        role="group"
        aria-label={`${spot.name}, ${spot.city}`}
      >
        {/* Real destination photo */}
        <img
          src={img}
          alt={spot.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full rounded-3xl object-cover transition-transform duration-700 group-hover:scale-115"
          style={{ transform: "translateZ(20px)" }}
        />

        {/* Dark Scrim Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" aria-hidden />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10" style={{ transform: "translateZ(35px)" }}>
          <span className="rounded-full bg-ink-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-300 backdrop-blur-md border border-brand-500/30 flex items-center gap-1">
            <span>{spot.emoji}</span>
            <span>{spot.country || "Spot"}</span>
          </span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 backdrop-blur-md border border-amber-500/40">
            ★ 4.9
          </span>
        </div>

        {/* Bottom Caption & Action */}
        <div
          className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-ink-900/85 p-3.5 backdrop-blur-xl shadow-2xl transition-all duration-300 group-hover:border-brand-500/40"
          style={{ transform: "translateZ(40px)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
            {spot.city}
          </p>
          <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-base font-bold leading-tight text-white line-clamp-1">
            {spot.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-300">{spot.description}</p>

          <a
            href={`/planner?q=${encodeURIComponent(`Plan a trip to ${spot.name} in ${spot.city}`)}`}
            className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-102 active:scale-98"
          >
            <span>Plan Trip Here</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
/* ------------------------- Season recommendations ------------------------ */

const SEASONS = [
  {
    name: "Summer",
    emoji: "☀️",
    months: "Jun – Aug",
    gradient: "from-amber-400/25 via-orange-500/15 to-transparent",
    ring: "hover:border-amber-400/60",
    picks: ["Santorini, Greece", "Bali, Indonesia", "Amalfi Coast, Italy"],
    blurb: "Long golden days, island hopping and late-sunset dinners by the water.",
  },
  {
    name: "Autumn",
    emoji: "🍂",
    months: "Sep – Nov",
    gradient: "from-rose-400/25 via-purple-500/15 to-transparent",
    ring: "hover:border-rose-400/60",
    picks: ["Kyoto, Japan", " Bavaria, Germany", "Quebec City, Canada"],
    blurb: "Fiery foliage, quiet temples and cozy café weather — photographers' favourite.",
  },
  {
    name: "Winter",
    emoji: "❄️",
    months: "Dec – Feb",
    gradient: "from-sky-400/25 via-indigo-500/15 to-transparent",
    ring: "hover:border-sky-400/60",
    picks: ["Swiss Alps", "Lapland, Finland", "Tokyo, Japan"],
    blurb: "Northern lights, ski runs and steaming street food under snowfall.",
  },
  {
    name: "Spring",
    emoji: "🌸",
    months: "Mar – May",
    gradient: "from-emerald-400/25 via-teal-500/15 to-transparent",
    ring: "hover:border-emerald-400/60",
    picks: ["Paris, France", "Washington D.C.", "Cappadocia, Türkiye"],
    blurb: "Blooming gardens, mild trails and balloon-filled sunrises — ideal first trip.",
  },
];

export function SeasonsSection() {
  return (
    <section className="px-4 py-16 sm:px-6" aria-labelledby="seasons-heading">
      <SectionTitle
        eyebrow="Travel by season"
        title="Where should you go right now?"
        subtitle="Every season has a perfect corner of the world. WanderSync factors the time of year into activities, pacing and packing hints."
      />
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SEASONS.map((season) => (
          <motion.div
            key={season.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <Card
              className={`group relative h-full overflow-hidden border-white/10 p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-18px_rgba(134,59,255,.45)] ${season.ring}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${season.gradient} opacity-70`} aria-hidden />
              <div className="relative">
                <span className="inline-block text-4xl transition-transform duration-300 group-hover:scale-125" aria-hidden>
                  {season.emoji}
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-slate-50">
                  {season.name}
                  <span className="ml-2 text-xs font-medium uppercase tracking-wide text-slate-400">{season.months}</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{season.blurb}</p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-200">
                  {season.picks.map((pick) => (
                    <li key={pick} className="flex items-center gap-1.5 rounded-md bg-black/20 px-2 py-1">
                      <span className="text-brand-300">›</span> {pick.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
