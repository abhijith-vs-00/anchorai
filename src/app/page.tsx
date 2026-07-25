"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function auth(body: Record<string, unknown>) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Request failed");
  return json.data.user;
}

export default function LandingPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function demo(role: "recoverer" | "companion") {
    setBusy(`demo-${role}`);
    setError(null);
    try {
      await auth({ action: "demo", role });
      router.push(role === "companion" ? "/companion" : "/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start demo");
      setBusy(null);
    }
  }

  return (
    <main className="bg-anchor-dark relative min-h-dvh overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1573497019940-1cfe7990d4ea?auto=format&fit=crop&w=1600&q=60)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 75%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/80 to-ink"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-10 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex-1 py-8">
          <p className="font-display text-5xl tracking-tight text-foam sm:text-6xl">Anchor</p>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
            Stay through the urge.
            <br />
            Learn from the moment.
            <br />
            Prepare for the next.
          </p>
          <p className="mt-8 max-w-sm text-sm text-muted">
            Privacy-first recovery support — for you, or for someone you care about. No real name
            required.
          </p>
        </section>

        <section className="card-panel w-full max-w-md p-6 shadow-2xl shadow-black/40 sm:p-8">
          <h1 className="font-display text-2xl text-foam">Get started</h1>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/login" className="btn-primary w-full text-base">
              Log in
            </Link>
            <Link href="/signup" className="btn-secondary w-full text-base">
              Sign up
            </Link>
          </div>

          <div className="my-6 h-px bg-line" />

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            See how it works
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Quick tour accounts. Demo session data may not stay forever — use the pitch accounts
            below for a stable walkthrough.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void demo("recoverer")}
              className="btn-secondary w-full flex-col items-start gap-0.5 py-3 text-left"
            >
              <span className="font-semibold text-foam">See as recoverer</span>
              <span className="text-xs text-muted">Starts a fresh Phoenix-style demo</span>
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void demo("companion")}
              className="btn-secondary w-full flex-col items-start gap-0.5 py-3 text-left"
            >
              <span className="font-semibold text-foam">See as companion</span>
              <span className="text-xs text-muted">Starts a fresh caregiver demo</span>
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-teal/25 bg-teal/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
              Pitch test accounts
            </p>
            <p className="mt-2 text-xs text-muted">Persistent seeded data for demos & evaluators.</p>
            <ul className="mt-3 space-y-2 text-sm text-foam">
              <li>
                <span className="text-muted">Recoverer:</span>{" "}
                <code className="text-teal">phoenix_demo</code> /{" "}
                <code className="text-teal">AnchorDemo1!</code>
              </li>
              <li>
                <span className="text-muted">Companion:</span>{" "}
                <code className="text-teal">care_demo</code> /{" "}
                <code className="text-teal">AnchorDemo1!</code>
              </li>
            </ul>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-coral">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
