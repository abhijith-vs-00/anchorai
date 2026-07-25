"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"recoverer" | "companion">("recoverer");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          role,
          username,
          email: email || undefined,
          password,
          alias: alias || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Signup failed");
      if (role === "companion") router.push("/companion");
      else router.push("/recovery/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setBusy(false);
    }
  }

  return (
    <main className="bg-anchor-dark flex min-h-dvh items-center justify-center px-6 py-12">
      <form onSubmit={submit} className="card-panel w-full max-w-md p-8">
        <Link href="/" className="font-display text-2xl text-teal">
          Anchor
        </Link>
        <h1 className="font-display mt-6 text-3xl">Create account</h1>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {(
            [
              ["recoverer", "I'm recovering"],
              ["companion", "I'm a companion"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                role === value
                  ? "bg-teal text-ink"
                  : "border border-line bg-white/5 text-foam"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="mt-6 block text-sm text-muted">
          Username (shareable)
          <input
            className="input-dark mt-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="phoenix_27"
            required
            minLength={3}
            maxLength={24}
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Email (optional)
          <input
            type="email"
            className="input-dark mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Display alias
          <input
            className="input-dark mt-2"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Phoenix"
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Password
          <input
            type="password"
            className="input-dark mt-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-coral">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-8 w-full disabled:opacity-60">
          {busy ? "Creating…" : "Sign up"}
        </button>
        <p className="mt-4 text-center text-sm text-muted">
          Have an account?{" "}
          <Link href="/login" className="text-teal hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
