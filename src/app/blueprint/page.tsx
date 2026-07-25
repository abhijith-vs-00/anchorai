"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MePayload = {
  user: {
    alias: string | null;
    username: string;
    sharedOverview?: { note?: string } | null;
  };
  journey: {
    monthLabel: string;
    daysInMonth: number;
    recoveryDays: number;
    difficultMoments: number;
    momentsOvercome: number;
    setbacks: number;
    reachedOut: number;
    toolsUsed: number;
  };
  memory: {
    narrative: string;
    hasEnoughData: boolean;
    patterns: { statement: string }[];
  };
  analysis: {
    chatSessions: number;
    avgDistress: number | null;
    recentInsights: string[];
    outcomeMix: { better: number; same: number; worse: number };
  };
  profile: {
    triggers: string[];
    copingStrategies: string[];
    motivations: string[];
  } | null;
};

export default function BlueprintPage() {
  const [data, setData] = useState<MePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed");
        setData(json.data);
        setNote(json.data.user?.sharedOverview?.note || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  const maxBar = useMemo(() => {
    if (!data) return 1;
    const j = data.journey;
    return Math.max(
      j.recoveryDays,
      j.difficultMoments,
      j.momentsOvercome,
      j.setbacks,
      j.toolsUsed,
      1
    );
  }, [data]);

  async function saveOverview() {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_overview", note }),
    });
    const json = await res.json();
    setShareMsg(
      json.success
        ? `Overview ready. Share your username @${data?.user.username} with a companion.`
        : json.error?.message || "Could not save"
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-coral">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-muted">Loading blueprint…</p>
      </main>
    );
  }

  const { journey, memory, analysis, profile, user } = data;

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/home" className="text-sm text-teal hover:underline">
            ← Home
          </Link>
          <Link href="/help" className="btn-primary text-sm">
            Help Me Now
          </Link>
        </div>

        <h1 className="font-display mt-6 text-4xl text-foam">Blueprint</h1>
        <p className="mt-2 text-muted">
          Your recovery map — patterns, preparation, and what companions can see.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Recovery days" value={`${journey.recoveryDays}/${journey.daysInMonth}`} />
          <Stat label="Moments overcome" value={String(journey.momentsOvercome)} />
          <Stat label="AI chats" value={String(analysis.chatSessions)} />
          <Stat
            label="Avg distress"
            value={analysis.avgDistress != null ? String(analysis.avgDistress) : "—"}
          />
        </div>

        <section className="card-panel mt-6 p-6">
          <h2 className="font-display text-xl">This month · {journey.monthLabel}</h2>
          <div className="mt-5 space-y-3">
            {[
              ["Recovery days", journey.recoveryDays, "bg-teal"],
              ["Difficult moments", journey.difficultMoments, "bg-amber"],
              ["Overcome", journey.momentsOvercome, "bg-sky"],
              ["Setbacks", journey.setbacks, "bg-coral"],
              ["Tools used", journey.toolsUsed, "bg-teal-deep"],
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted">{label}</span>
                  <span className="font-semibold">{value as number}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{
                      width: `${Math.min(100, ((value as number) / maxBar) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="card-panel p-6">
            <h2 className="font-display text-xl">Recovery Memory</h2>
            <p className="mt-3 leading-relaxed text-foam/90">{memory.narrative}</p>
            {memory.patterns.length > 0 && (
              <ul className="mt-4 space-y-2">
                {memory.patterns.map((p) => (
                  <li key={p.statement} className="rounded-xl bg-white/5 px-4 py-3 text-sm">
                    {p.statement}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card-panel p-6">
            <h2 className="font-display text-xl">Outcome mix</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Pill label="Better" value={analysis.outcomeMix.better} tone="text-teal" />
              <Pill label="Same" value={analysis.outcomeMix.same} tone="text-amber" />
              <Pill label="Harder" value={analysis.outcomeMix.worse} tone="text-coral" />
            </div>
            {analysis.recentInsights.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted">
                  Chat insights
                </h3>
                <ul className="mt-2 space-y-2">
                  {analysis.recentInsights.map((insight) => (
                    <li key={insight} className="text-sm text-foam/80">
                      · {insight}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        <section className="card-panel mt-6 p-6">
          <h2 className="font-display text-xl">Your profile</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile?.triggers ?? []).map((t) => (
              <span key={t} className="rounded-full bg-coral/15 px-3 py-1 text-xs text-coral">
                {t}
              </span>
            ))}
            {(profile?.copingStrategies ?? []).map((t) => (
              <span key={t} className="rounded-full bg-teal/15 px-3 py-1 text-xs text-teal">
                {t}
              </span>
            ))}
            {(profile?.motivations ?? []).map((t) => (
              <span key={t} className="rounded-full bg-sky/15 px-3 py-1 text-xs text-sky">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/recovery/prepare" className="btn-secondary text-sm">
              Prepare Me
            </Link>
            <Link href="/recovery/memory" className="btn-secondary text-sm">
              Full memory
            </Link>
            <Link href="/resources" className="btn-secondary text-sm">
              Resources
            </Link>
          </div>
        </section>

        <section className="card-panel mt-6 p-6">
          <h2 className="font-display text-xl">Share with a companion</h2>
          <p className="mt-2 text-sm text-muted">
            Give them your username <strong className="text-teal">@{user.username}</strong>. They
            see an overview — never your private chats unless you post to the support board.
          </p>
          <textarea
            className="input-dark mt-4 min-h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for linked companions…"
            maxLength={300}
          />
          <button type="button" onClick={() => void saveOverview()} className="btn-primary mt-4">
            Update shared overview
          </button>
          {shareMsg && <p className="mt-3 text-sm text-teal">{shareMsg}</p>}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-panel p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl text-foam">{value}</p>
    </div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-4">
      <p className={`font-display text-2xl ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
