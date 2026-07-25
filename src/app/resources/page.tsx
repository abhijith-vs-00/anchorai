"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Resource } from "@/types";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/resources");
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed");
        setResources(json.data.resources);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load resources");
      }
    })();
  }, []);

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/recovery" className="text-sm text-teal hover:underline">
          ← Back
        </Link>
        <h1 className="font-display mt-6 text-4xl text-foam">Resources</h1>
        <p className="mt-3 text-foam/70">
          Curated, verified educational content — not invented by AI.
        </p>

        {error && <p className="mt-6 text-coral">{error}</p>}
        {!error && resources.length === 0 && (
          <p className="mt-6 text-foam/60">
            No resources yet. Run <code className="rounded bg-black/40 px-1">npm run seed</code>.
          </p>
        )}

        <ul className="mt-8 space-y-4">
          {resources.map((r) => (
            <li key={r._id} className="rounded-2xl bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-teal">{r.category}</p>
              <a
                href={r.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block font-display text-xl text-foam hover:underline"
              >
                {r.title}
              </a>
              <p className="mt-2 text-sm text-foam/75">{r.summary}</p>
              <p className="mt-2 text-xs text-foam/50">{r.sourceName}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
