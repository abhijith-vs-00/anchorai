"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ action: "login", login, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Login failed");
      const role = json.data.user.role;
      router.push(role === "companion" ? "/companion" : "/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="bg-anchor-dark flex min-h-dvh items-center justify-center px-6 py-12">
      <form onSubmit={submit} className="card-panel w-full max-w-md p-8">
        <Link href="/" className="font-display text-2xl text-teal">
          Anchor
        </Link>
        <h1 className="font-display mt-6 text-3xl">Log in</h1>
        <p className="mt-2 text-sm text-muted">Email or username + password</p>

        <label className="mt-8 block text-sm text-muted">
          Email or username
          <input
            className="input-dark mt-2"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="mt-4 block text-sm text-muted">
          Password
          <input
            type="password"
            className="input-dark mt-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-coral">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-8 w-full disabled:opacity-60">
          {busy ? "Signing in…" : "Log in"}
        </button>
        <p className="mt-4 text-center text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="text-teal hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
