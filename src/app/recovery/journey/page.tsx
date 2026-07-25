"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Journey = {
  monthLabel: string;
  daysInMonth: number;
  recoveryDays: number;
  difficultMoments: number;
  momentsOvercome: number;
  setbacks: number;
  reachedOut: number;
  toolsUsed: number;
};

export default function JourneyPage() {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed");
        setJourney(json.data.journey);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/recovery" className="text-sm text-teal hover:underline">
          ← Dashboard
        </Link>
        <h1 className="font-display mt-6 text-4xl text-foam">Your Recovery Journey</h1>
        <p className="mt-3 text-foam/70">
          Progress isn&apos;t erased by a hard day. This is a record of showing up.
        </p>

        {error && <p className="mt-6 text-coral">{error}</p>}
        {!journey && !error && <p className="mt-6 text-foam/60">Loading…</p>}

        {journey && (
          <>
            <p className="mt-8 text-sm uppercase tracking-wider text-teal">
              {journey.monthLabel}
            </p>
            <dl className="mt-4 space-y-3">
              {[
                ["Recovery days", `${journey.recoveryDays} / ${journey.daysInMonth}`],
                ["Difficult moments", String(journey.difficultMoments)],
                ["Moments overcome", String(journey.momentsOvercome)],
                ["Setbacks", String(journey.setbacks)],
                ["Reached out for help", String(journey.reachedOut)],
                ["Anchor tools used", String(journey.toolsUsed)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-5 py-4"
                >
                  <dt className="text-foam/75">{label}</dt>
                  <dd className="font-display text-xl text-foam">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/recovery/setback"
              className="mt-10 block rounded-2xl border border-line px-5 py-4 text-center text-foam"
            >
              I had a setback
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
