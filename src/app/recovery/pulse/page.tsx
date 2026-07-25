"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const TRIGGERS = [
  "Work",
  "Sleep",
  "Lonely",
  "Anxiety",
  "Social",
  "Relationship",
  "Other",
  "Not sure",
];

function PulseInner() {
  const router = useRouter();
  const params = useSearchParams();
  const state = (params.get("state") || "good") as
    | "good"
    | "a_little_off"
    | "struggling"
    | "need_support";
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(trigger?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, trigger }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      if (state === "need_support" || state === "struggling") {
        router.push("/recovery/anchor");
        return;
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save check-in");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="bg-anchor-dark flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-3xl text-foam">Noted.</p>
        <p className="mt-3 text-foam/70">Thanks for checking in.</p>
        <Link href="/recovery" className="mt-8 text-teal hover:underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (state === "good") {
    return (
      <main className="bg-anchor-dark flex min-h-dvh flex-col items-center justify-center px-6">
        <p className="font-display text-3xl text-foam">Good to hear.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => submit()}
          className="mt-8 rounded-2xl bg-teal px-8 py-4 text-ink disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save check-in"}
        </button>
        {error && <p className="mt-4 text-coral">{error}</p>}
      </main>
    );
  }

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl text-foam">What&apos;s affecting you?</h1>
        <div className="mt-8 flex flex-wrap gap-3">
          {TRIGGERS.map((t) => (
            <button
              key={t}
              type="button"
              disabled={busy}
              onClick={() => submit(t)}
              className="rounded-2xl bg-white/5 px-5 py-4 text-foam ring-1 ring-line disabled:opacity-60"
            >
              {t}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-coral">{error}</p>}
        <Link href="/recovery" className="mt-10 inline-block text-sm text-teal">
          Cancel
        </Link>
      </div>
    </main>
  );
}

export default function PulsePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh p-8">Loading…</main>}>
      <PulseInner />
    </Suspense>
  );
}
