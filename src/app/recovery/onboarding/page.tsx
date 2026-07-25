"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const TRIGGERS = [
  "Work stress",
  "Loneliness",
  "Relationship conflict",
  "Social situations",
  "Anxiety",
  "Poor sleep",
  "Financial stress",
  "Difficult memories",
  "Other",
];

const COPING = [
  "Walking",
  "Music",
  "Breathing",
  "Meditation",
  "Exercise",
  "Talking to someone",
  "Shower",
  "Going outside",
  "Other",
];

const MOTIVATIONS = [
  "Family",
  "Relationships",
  "Career",
  "Health",
  "Fresh start",
  "Personal reason",
];

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const isDemo = params.get("demo") === "1";

  const [step, setStep] = useState(isDemo ? 1 : 0);
  const [alias, setAlias] = useState(isDemo ? "Phoenix" : "");
  const [triggers, setTriggers] = useState<string[]>(
    isDemo ? ["Work stress", "Loneliness"] : []
  );
  const [coping, setCoping] = useState<string[]>(
    isDemo ? ["Walking", "Talking to someone"] : []
  );
  const [motivations, setMotivations] = useState<string[]>(
    isDemo ? ["Family"] : []
  );
  const [motivationCustom, setMotivationCustom] = useState(
    isDemo ? "I want to be present for my family." : ""
  );
  const [safeName, setSafeName] = useState("");
  const [safeRel, setSafeRel] = useState("");
  const [safePhone, setSafePhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    return [
      "What should Anchor call you?",
      "What tends to make things harder?",
      "What usually helps you?",
      "Why does recovery matter to you?",
      "Anyone safe to reach? (optional)",
    ][step];
  }, [step]);

  async function saveAlias(opts: {
    alias?: string | null;
    random?: boolean;
    skip?: boolean;
  }) {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "alias", ...opts }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || "Failed");
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      if (!isDemo && step === 0) {
        // handled separately
      }
      const safeContacts =
        safeName.trim()
          ? [
              {
                name: safeName.trim(),
                relationship: safeRel.trim() || "Trusted person",
                phone: safePhone.trim() || undefined,
              },
            ]
          : [];

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "blueprint",
          triggers,
          copingStrategies: coping,
          motivations,
          motivationCustom: motivationCustom || undefined,
          safeContacts,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      router.push("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  async function nextFromAlias(kind: "save" | "random" | "skip") {
    setBusy(true);
    setError(null);
    try {
      if (kind === "random") {
        await saveAlias({ random: true });
      } else if (kind === "skip") {
        await saveAlias({ skip: true });
      } else {
        await saveAlias({ alias: alias.trim() || null });
      }
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-12">
      <div className="mx-auto max-w-lg">
        <p className="font-display text-2xl text-foam">Anchor</p>
        <p className="mt-2 text-sm text-foam/60">
          Tell Anchor only what helps Anchor support you.
          {isDemo && (
            <span className="ml-2 rounded bg-amber/20 px-2 py-0.5 text-xs">
              Demo data
            </span>
          )}
        </p>

        <h1 className="font-display mt-10 text-3xl text-foam">{title}</h1>

        {step === 0 && (
          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="sr-only">Alias</span>
              <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Phoenix"
                maxLength={40}
                className="w-full rounded-2xl border border-line bg-black/40 px-5 py-4 text-lg outline-none focus:border-anchor-sea"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => nextFromAlias("save")}
                className="rounded-xl bg-teal px-5 py-3 text-ink"
              >
                Continue
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => nextFromAlias("random")}
                className="rounded-xl border border-anchor-deep/20 px-5 py-3"
              >
                Give me a name
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => nextFromAlias("skip")}
                className="rounded-xl px-5 py-3 text-teal"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <ChipGrid
            options={TRIGGERS}
            selected={triggers}
            onToggle={(v) => setTriggers(toggle(triggers, v))}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <ChipGrid
            options={COPING}
            selected={coping}
            onToggle={(v) => setCoping(toggle(coping, v))}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <div className="mt-8">
            <ChipGrid
              options={MOTIVATIONS}
              selected={motivations}
              onToggle={(v) => setMotivations(toggle(motivations, v))}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
              hideNav
            />
            <label className="mt-4 block">
              <span className="text-sm text-foam/70">Optional — in your words</span>
              <textarea
                value={motivationCustom}
                onChange={(e) => setMotivationCustom(e.target.value)}
                rows={3}
                maxLength={300}
                className="mt-2 w-full rounded-2xl border border-line bg-black/40 px-4 py-3"
                placeholder="I want to be present for…"
              />
            </label>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="rounded-xl px-4 py-3">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-xl bg-teal px-5 py-3 text-ink"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="mt-8 space-y-3">
            <input
              value={safeName}
              onChange={(e) => setSafeName(e.target.value)}
              placeholder="Name or alias"
              className="w-full rounded-2xl border border-line bg-black/40 px-4 py-3"
            />
            <input
              value={safeRel}
              onChange={(e) => setSafeRel(e.target.value)}
              placeholder="Relationship"
              className="w-full rounded-2xl border border-line bg-black/40 px-4 py-3"
            />
            <input
              value={safePhone}
              onChange={(e) => setSafePhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full rounded-2xl border border-line bg-black/40 px-4 py-3"
            />
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={() => setStep(3)} className="rounded-xl px-4 py-3">
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={finish}
                className="rounded-xl bg-teal px-5 py-3 text-ink disabled:opacity-60"
              >
                {busy ? "Saving…" : "Finish"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setSafeName("");
                  setSafeRel("");
                  setSafePhone("");
                  void finish();
                }}
                className="rounded-xl px-4 py-3 text-teal"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-coral">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function ChipGrid({
  options,
  selected,
  onToggle,
  onNext,
  onBack,
  hideNav,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  hideNav?: boolean;
}) {
  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(opt)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-anchor-teal text-white"
                  : "bg-black/40 text-foam ring-1 ring-line"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {!hideNav && (
        <div className="mt-6 flex gap-3">
          {onBack && (
            <button type="button" onClick={onBack} className="rounded-xl px-4 py-3">
              Back
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-teal px-5 py-3 text-ink"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="bg-anchor-dark min-h-dvh p-8">Loading…</main>}>
      <OnboardingInner />
    </Suspense>
  );
}
