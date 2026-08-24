/** Temporary Phase-1 shell — replaced by the router + layout system in the UI phase. */
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight">
          WanderSync
        </h1>
        <p className="mt-3 text-lg text-slate-300">
          Your AI Travel Companion. From Dream to Itinerary.
        </p>
        <p className="mt-8 text-xs uppercase tracking-widest text-slate-500">
          Frontend online · API at /api/v1/
        </p>
      </div>
    </main>
  );
}
