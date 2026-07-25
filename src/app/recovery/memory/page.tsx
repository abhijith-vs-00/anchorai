"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Memory = {
  patterns: { statement: string }[];
  timeHint: string | null;
  narrative: string;
  hasEnoughData: boolean;
};

export default function MemoryPage() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/recovery-memory");
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed");
        setMemory(json.data.memory);
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
        <h1 className="font-display mt-6 text-4xl text-foam">Your Recovery Memory</h1>
        <p className="mt-3 text-foam/70">
          Patterns from what you actually recorded — not predictions.
        </p>

        {error && <p className="mt-6 text-coral">{error}</p>}
        {!memory && !error && <p className="mt-6 text-foam/60">Loading…</p>}

        {memory && (
          <div className="mt-8 space-y-4">
            <p className="text-lg leading-relaxed text-foam">{memory.narrative}</p>
            {memory.hasEnoughData && (
              <ul className="space-y-3">
                {memory.patterns.map((p) => (
                  <li
                    key={p.statement}
                    className="rounded-2xl bg-white/5 px-5 py-4 text-foam"
                  >
                    {p.statement}
                  </li>
                ))}
                {memory.timeHint && (
                  <li className="rounded-2xl bg-white/5 px-5 py-4 text-foam">
                    {memory.timeHint}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
