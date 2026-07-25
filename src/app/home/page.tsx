"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  alias: string | null;
  username: string;
  role: string;
  onboardingCompleted: boolean;
  isDemo?: boolean;
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json();
        if (!json.success) {
          router.replace("/login");
          return;
        }
        const u = json.data.user;
        if (u.role === "companion") {
          router.replace("/companion");
          return;
        }
        if (!u.onboardingCompleted) {
          router.replace("/recovery/onboarding");
          return;
        }
        setUser(u);
      } catch {
        setError("Could not load your home.");
      }
    })();
  }, [router]);

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/");
  }

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-coral">{error}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-muted">Loading…</p>
      </main>
    );
  }

  const name = user.alias || user.username;

  return (
    <main className="bg-anchor-dark min-h-dvh">
      <div className="relative mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-teal">Anchor</p>
            <h1 className="font-display mt-3 text-3xl text-foam sm:text-4xl">
              Hello, {name}
            </h1>
            <p className="mt-2 text-sm text-muted">
              @{user.username}
              {user.isDemo && (
                <span className="ml-2 rounded bg-amber/20 px-2 py-0.5 text-xs text-amber">
                  Demo · data may not persist
                </span>
              )}
            </p>
          </div>
          <button type="button" onClick={() => void logout()} className="btn-secondary text-sm">
            Log out
          </button>
        </header>

        <div
          className="relative mt-8 overflow-hidden rounded-3xl border border-line"
          style={{ minHeight: 200 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=60)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
          <div className="relative flex min-h-[200px] flex-col justify-center p-6 sm:p-10">
            <p className="font-display text-3xl text-foam sm:text-4xl">
              You don&apos;t have to do this alone.
            </p>
            <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">
              Prepare with your Blueprint, get through the urge now, or cool down after a hard
              moment — and talk to Anchor AI or a human when you need company.
            </p>
          </div>
        </div>

        {/* Primary path row */}
        <section className="mt-8" aria-label="Main paths">
          <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
            <PathCard
              href="/blueprint"
              title="Blueprint"
              subtitle="Dashboard, patterns & prep"
              accent="from-sky/30 to-teal/10"
              className="flex-1"
            />
            <OrDivider />
            <PathCard
              href="/help"
              title="Help Me Now"
              subtitle="Timer · strategies · support"
              accent="from-teal/40 to-teal-deep/20"
              primary
              className="flex-1"
            />
            <OrDivider />
            <PathCard
              href="/after"
              title="After"
              subtitle="I relapsed — help me cool down"
              accent="from-coral/30 to-amber/10"
              className="flex-1"
            />
          </div>
        </section>

        {/* Explicit talk / timer features */}
        <section className="mt-8" aria-labelledby="talk-heading">
          <h2
            id="talk-heading"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-teal"
          >
            I really need to talk / stay through this
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <FeatureCard
              href="/help?mode=timer"
              eyebrow="Urge timer"
              title="3-minute urge surf"
              body="Full-screen timer. Stay with the wave until it passes — tap when it spikes."
              cta="Start timer"
              tone="border-teal/40 bg-teal/10"
            />
            <FeatureCard
              href="/help?mode=ai"
              eyebrow="Talk to Anchor AI"
              title="Chat with Gemini"
              body="Type or speak. Anchor responds in the moment and remembers patterns in your Blueprint."
              cta="Talk to AI"
              tone="border-sky/40 bg-sky/10"
            />
            <FeatureCard
              href="/help?mode=human"
              eyebrow="Talk to a human"
              title="Ask a companion"
              body="Post to the board. Companions see your alias + overview — not your real identity."
              cta="I need a human"
              tone="border-coral/40 bg-coral/10"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center justify-center lg:px-1" aria-hidden>
      <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
        or
      </span>
    </div>
  );
}

function PathCard({
  href,
  title,
  subtitle,
  accent,
  primary,
  className = "",
}: {
  href: string;
  title: string;
  subtitle: string;
  accent: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`card-panel relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-teal/40 ${
        primary ? "ring-1 ring-teal/40" : ""
      } ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-80`} aria-hidden />
      <div className="relative">
        <h2 className="font-display text-xl text-foam sm:text-2xl">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
        <span className="mt-4 inline-block text-sm font-semibold text-teal">Open →</span>
      </div>
    </Link>
  );
}

function FeatureCard({
  href,
  eyebrow,
  title,
  body,
  cta,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 ${tone}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
      <h3 className="font-display mt-2 text-xl text-foam">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      <span className="mt-4 inline-flex text-sm font-bold text-teal">{cta} →</span>
    </Link>
  );
}
