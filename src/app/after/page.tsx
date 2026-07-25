"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const CALM = [
  "You reached out. That matters.",
  "A setback does not erase your progress.",
  "Right now: water, breath, one safe next step.",
  "You don't have to solve everything tonight.",
];

const TRIGGERS = [
  "Work stress",
  "Alone",
  "Social situation",
  "Argument",
  "Strong emotion",
  "Not sure",
];

function AfterInner() {
  const params = useSearchParams();
  const urgentFirst = params.get("urgent") === "1";
  const [step, setStep] = useState(urgentFirst ? 0 : 0);
  const [phase, setPhase] = useState<"calm" | "reflect" | "done" | "urgent">(
    urgentFirst ? "urgent" : "calm"
  );
  const [trigger, setTrigger] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(help: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/setbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precedingTrigger: trigger || "Not sure",
          urgePresent: "yes",
          possibleHelpfulAction: help,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-lg">
        <Link href="/home" className="text-sm text-teal hover:underline">
          ← Home
        </Link>
        <h1 className="font-display mt-6 text-4xl">After</h1>
        <p className="mt-2 text-muted">I just relapsed — help me cool down.</p>

        {phase === "calm" && (
          <div className="mt-8 space-y-4">
            {CALM.map((line) => (
              <p key={line} className="card-panel px-5 py-4 font-display text-xl text-foam">
                {line}
              </p>
            ))}
            <button type="button" className="btn-primary mt-4 w-full" onClick={() => setPhase("reflect")}>
              I&apos;m ready to reflect
            </button>
            <button type="button" className="btn-danger w-full" onClick={() => setPhase("urgent")}>
              I need urgent help
            </button>
            <Link href="/help" className="btn-secondary mt-2 flex w-full">
              Open Help Me Now
            </Link>
          </div>
        )}

        {phase === "reflect" && step === 0 && (
          <div className="mt-8">
            <p className="text-sm uppercase tracking-wider text-teal">What happened beforehand?</p>
            <div className="mt-4 space-y-2">
              {TRIGGERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="btn-secondary w-full text-left"
                  onClick={() => {
                    setTrigger(t);
                    setStep(1);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "reflect" && step === 1 && (
          <div className="mt-8">
            <p className="text-sm uppercase tracking-wider text-teal">What might help next time?</p>
            <div className="mt-4 space-y-2">
              {[
                "Leaving earlier",
                "Calling someone",
                "Opening Anchor earlier",
                "Talking to AI",
                "I don't know",
              ].map((h) => (
                <button
                  key={h}
                  type="button"
                  disabled={busy}
                  className="btn-secondary w-full text-left disabled:opacity-50"
                  onClick={() => void save(h)}
                >
                  {h}
                </button>
              ))}
            </div>
            {error && <p className="mt-3 text-coral">{error}</p>}
          </div>
        )}

        {phase === "done" && (
          <div className="card-panel mt-8 p-6 text-center">
            <p className="font-display text-3xl text-teal">Thank you for checking in.</p>
            <p className="mt-3 text-muted">
              Nothing here says you failed. This feeds your Blueprint so next time can be different.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/blueprint" className="btn-primary">
                View Blueprint
              </Link>
              <Link href="/help" className="btn-secondary">
                Help Me Now
              </Link>
            </div>
          </div>
        )}

        {phase === "urgent" && (
          <div className="mt-8 space-y-4">
            <p className="font-display text-2xl">Get real-world help</p>
            <a
              href="https://988lifeline.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-danger flex w-full"
            >
              988 Suicide & Crisis Lifeline
            </a>
            <a
              href="https://www.samhsa.gov/find-help/national-helpline"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex w-full"
            >
              SAMHSA National Helpline
            </a>
            <p className="text-sm text-muted">
              If you are in immediate danger, contact your local emergency services.
            </p>
            <button type="button" className="btn-secondary w-full" onClick={() => setPhase("calm")}>
              Back to calm
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AfterPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh p-8 text-muted">Loading…</main>}>
      <AfterInner />
    </Suspense>
  );
}
