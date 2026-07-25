"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PreventionPlan } from "@/types";

const SITUATIONS = [
  "Social event",
  "Stressful workday",
  "Being home alone",
  "Travelling",
  "Difficult conversation",
  "Something else",
];

export default function PreparePage() {
  const [phase, setPhase] = useState<"pick" | "loading" | "plan" | "list">("pick");
  const [plan, setPlan] = useState<PreventionPlan | null>(null);
  const [plans, setPlans] = useState<PreventionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/prevention-plans");
      const json = await res.json();
      if (json.success) setPlans(json.data.plans);
    })();
  }, [phase]);

  async function create(situation: string) {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/prevention-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      setPlan(json.data.plan);
      setUsedFallback(Boolean(json.data.usedFallback));
      setPhase("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create plan");
      setPhase("pick");
    }
  }

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/recovery" className="text-sm text-teal hover:underline">
          ← Dashboard
        </Link>
        <h1 className="font-display mt-6 text-4xl text-foam">Prepare Me</h1>
        <p className="mt-3 text-foam/70">Something difficult coming up?</p>

        {phase === "pick" && (
          <>
            <div className="mt-8 flex flex-col gap-2">
              {SITUATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void create(s)}
                  className="rounded-2xl bg-teal px-5 py-4 text-left text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
            {plans.length > 0 && (
              <button
                type="button"
                onClick={() => setPhase("list")}
                className="mt-8 text-sm text-teal hover:underline"
              >
                Reopen a saved plan
              </button>
            )}
            {error && <p className="mt-4 text-coral">{error}</p>}
          </>
        )}

        {phase === "loading" && (
          <p className="mt-10 text-foam/70" role="status">
            Building your plan…
          </p>
        )}

        {phase === "plan" && plan && (
          <article className="mt-8">
            <h2 className="font-display text-2xl text-foam">
              My plan for {plan.situation.toLowerCase()}
            </h2>
            {usedFallback && (
              <p className="mt-2 text-xs text-amber">
                Using a solid default plan while AI is unavailable.
              </p>
            )}
            <Section title="Before" items={plan.generatedPlan.before} />
            <Section title="If things get difficult" items={plan.generatedPlan.ifDifficult} numbered />
            <Section title="Exit plan" items={plan.generatedPlan.exitPlan} />
            <div className="mt-8 rounded-2xl bg-white/5 px-5 py-4">
              <p className="text-sm uppercase tracking-wider text-teal">Remember why</p>
              <p className="font-display mt-2 text-xl text-foam">
                &ldquo;{plan.generatedPlan.rememberWhy}&rdquo;
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPlan(null);
                setPhase("pick");
              }}
              className="mt-8 text-teal hover:underline"
            >
              Create another
            </button>
          </article>
        )}

        {phase === "list" && (
          <ul className="mt-8 space-y-2">
            {plans.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlan(p);
                    setPhase("plan");
                  }}
                  className="w-full rounded-2xl bg-white/5 px-5 py-4 text-left"
                >
                  {p.situation}
                  <span className="mt-1 block text-xs text-foam/50">
                    {new Date(p.createdAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => setPhase("pick")}
                className="text-sm text-teal"
              >
                Back
              </button>
            </li>
          </ul>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  items,
  numbered,
}: {
  title: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <section className="mt-8">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-teal">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={item} className="rounded-xl bg-white/5 px-4 py-3 text-foam">
            {numbered ? `${i + 1}. ${item}` : `✓ ${item}`}
          </li>
        ))}
      </ul>
    </section>
  );
}
