/** Social proof — traveller testimonials with ratings. */
const TESTIMONIALS = [
  {
    name: "Ayesha K.",
    role: "Backpacker · Lahore",
    quote:
      "WanderSync planned my 5-day Istanbul trip in under a minute. The route map alone saved me hours of guessing metro lines.",
    rating: 5,
    initials: "AK",
  },
  {
    name: "Daniel M.",
    role: "Family traveller · London",
    quote:
      "The budget breakdown kept us honest — we came in under plan for the first time ever. The rainy-day swaps were a lifesaver.",
    rating: 5,
    initials: "DM",
  },
  {
    name: "Sofia R.",
    role: "Solo adventurer · Madrid",
    quote:
      "I love that the AI rebuilds a whole day when I'm tired. One tap and my packed day became a relaxed spa-and-café afternoon.",
    rating: 4,
    initials: "SR",
  },
  {
    name: "Bilal H.",
    role: "Weekend explorer · Dubai",
    quote:
      "Sharing itineraries with friends used to mean messy screenshots. Now I send one link and everyone sees the live plan.",
    rating: 5,
    initials: "BH",
  },
];

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
          Loved by travellers
        </p>
        <h2
          id="testimonials-heading"
          className="mt-2 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl"
        >
          Don't take our word for it
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <figure className="flex h-full flex-col rounded-xl border border-ink-700 bg-ink-800/80 p-5">
                <div className="flex gap-0.5 text-sm" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} aria-hidden className={i < t.rating ? "text-brand-400" : "text-ink-600"}>
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-300">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-ink-700 pt-3">
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-300"
                  >
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-100">{t.name}</span>
                    <span className="block text-xs text-slate-500">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Frequently asked questions with accessible disclosure rows. */
const FAQS = [
  {
    q: "How does the AI plan my itinerary?",
    a: "Describe your destination, dates, pace and interests. WanderSync's AI drafts a day-by-day plan with real landmarks, travel times and cost estimates — then an optimizer reorders stops to cut backtracking.",
  },
  {
    q: "Can I change the generated plan?",
    a: "Absolutely. Add or remove activities, regenerate any day with a different mood (relaxed, packed, budget…), or use Smart Actions like “make it cheaper” to let the AI rework the whole trip.",
  },
  {
    q: "Does it show maps and weather?",
    a: "Yes. Every stop appears on an interactive Google Map (OpenStreetMap fallback), and the weather panel shows live conditions plus a forecast aligned to your travel dates.",
  },
  {
    q: "How is my budget tracked?",
    a: "Each activity carries a cost estimate grouped into accommodation, transport, food and activities. You declare a total budget and WanderSync shows a live breakdown, daily average and what's left.",
  },
  {
    q: "Is WanderSync free to use?",
    a: "The core planner runs in demo mode at no cost so you can try everything. Connect your own AI provider key anytime for fully custom generation.",
  },
  {
    q: "Can I share trips with friends?",
    a: "Yes — generate a read-only share link for any trip, export a PDF for printing, or add the itinerary straight to your calendar as an .ics file.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-heading" className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
          Good to know
        </p>
        <h2
          id="faq-heading"
          className="mt-2 text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl"
        >
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-ink-700 bg-ink-800/80 px-4 py-3 open:border-brand-500/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-100 [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="shrink-0 text-brand-400 transition-transform duration-200 group-open:rotate-45"
                >
                  ＋
                </span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
