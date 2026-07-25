"use client";

import Link from "next/link";
import { useState } from "react";

const TRIGGERS = [
  "Work stress",
  "Alone",
  "Social situation",
  "Argument",
  "Strong emotion",
  "Not sure",
];

const HELPS = [
  "Leaving earlier",
  "Calling someone",
  "Opening Anchor earlier",
  "Avoiding the situation",
  "I don't know",
];

export default function SetbackPage() {
  const [step, setStep] = useState(0);
  const [trigger, setTrigger] = useState("");
  const [urge, setUrge] = useState<"yes" | "no" | "dont_remember" | "">("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(possibleHelpfulAction: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/setbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precedingTrigger: trigger,
          urgePresent: urge,
          possibleHelpfulAction,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="bg-anchor-dark flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-3xl text-foam">Thank you for checking in.</p>
        <p className="mt-4 max-w-md text-foam/70">
          Understanding what happened helps prepare for next time. Nothing here says you failed.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/recovery/prepare" className="rounded-2xl bg-teal px-6 py-3 text-ink">
            Prepare Me
          </Link>
          <Link href="/recovery/journey" className="text-teal hover:underline">
            View journey
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/recovery" className="text-sm text-teal">
          ← Dashboard
        </Link>
        <h1 className="font-display mt-6 text-3xl text-foam">I had a setback</h1>
        <p className="mt-3 text-foam/70">
          Thanks for checking in. Let&apos;s understand what happened so we can prepare better next
          time.
        </p>

        {step === 0 && (
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              What happened beforehand?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {TRIGGERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTrigger(t);
                    setStep(1);
                  }}
                  className="rounded-2xl bg-white/5 px-5 py-4 text-left"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              Was there an urge beforehand?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {(
                [
                  ["yes", "Yes"],
                  ["no", "No"],
                  ["dont_remember", "Don't remember"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setUrge(value);
                    setStep(2);
                  }}
                  className="rounded-2xl bg-white/5 px-5 py-4 text-left"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              What might have helped?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {HELPS.map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void submit(h);
                  }}
                  className="rounded-2xl bg-white/5 px-5 py-4 text-left disabled:opacity-60"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-coral">{error}</p>}
      </div>
    </main>
  );
}
