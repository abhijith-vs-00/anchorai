"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Post = {
  _id: string;
  authorAlias: string;
  content: string;
  overview: {
    triggers: string[];
    copingStrategies: string[];
    motivations: string[];
    note?: string;
  };
  replies: { companionAlias: string; content: string; createdAt: string }[];
  createdAt: string;
  status: string;
};

type Recoverer = {
  username: string;
  alias: string | null;
  overview: Post["overview"] | null;
};

export default function CompanionHome() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [recoverers, setRecoverers] = useState<Recoverer[]>([]);
  const [linkUser, setLinkUser] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [guidance, setGuidance] = useState<{
    tryThis: string[];
    avoidThis: string[];
    why: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [board, links] = await Promise.all([
      fetch("/api/support?scope=board").then((r) => r.json()),
      fetch("/api/links").then((r) => r.json()),
    ]);
    if (!board.success || !links.success) {
      if (board.error?.code === "UNAUTHORIZED" || links.error?.code === "UNAUTHORIZED") {
        router.replace("/login");
        return;
      }
      throw new Error(board.error?.message || links.error?.message || "Failed");
    }
    setPosts(board.data.posts || []);
    setRecoverers(links.data.recoverers || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [router]);

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/");
  }

  async function link() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link", recovererUsername: linkUser }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Link failed");
      setLinkUser("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link failed");
    } finally {
      setBusy(false);
    }
  }

  async function reply(postId: string) {
    const content = replyDrafts[postId]?.trim();
    if (!content) return;
    setBusy(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", postId, content }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Reply failed");
      setReplyDrafts((d) => ({ ...d, [postId]: "" }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reply failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadGuidance() {
    setBusy(true);
    try {
      const res = await fetch("/api/companion/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship: "Someone I care about",
          situation: "They're having a strong urge",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      setGuidance(json.data.guidance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-anchor-dark min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-teal">Anchor</p>
            <h1 className="font-display mt-2 text-3xl">Companion Mode</h1>
            <p className="mt-2 text-sm text-muted">
              Support without surveillance — reply to posts, link to a username, get coaching tips.
            </p>
          </div>
          <button type="button" onClick={() => void logout()} className="btn-secondary text-sm">
            Log out
          </button>
        </header>

        <div
          className="relative mt-8 overflow-hidden rounded-3xl border border-line"
          style={{ minHeight: 140 }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1400&q=60)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-transparent" />
          <div className="relative p-6">
            <p className="font-display text-2xl">Be present. Don&apos;t police.</p>
            <p className="mt-2 max-w-md text-sm text-muted">
              You won&apos;t see private chats or medical records — only what someone chooses to share.
            </p>
          </div>
        </div>

        <section className="card-panel mt-6 p-6">
          <h2 className="font-display text-xl">Link a recoverer</h2>
          <p className="mt-2 text-sm text-muted">
            Enter the username they shared with you (e.g. phoenix_27).
          </p>
          <div className="mt-4 flex gap-2">
            <input
              className="input-dark flex-1"
              value={linkUser}
              onChange={(e) => setLinkUser(e.target.value)}
              placeholder="username"
            />
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void link()}>
              Link
            </button>
          </div>
          {recoverers.length > 0 && (
            <ul className="mt-4 space-y-3">
              {recoverers.map((r) => (
                <li key={r.username} className="rounded-xl bg-white/5 px-4 py-3">
                  <p className="font-semibold">
                    {r.alias || r.username}{" "}
                    <span className="text-sm font-normal text-muted">@{r.username}</span>
                  </p>
                  {r.overview && (
                    <p className="mt-2 text-sm text-muted">
                      Triggers: {r.overview.triggers.join(", ") || "—"} · Helps:{" "}
                      {r.overview.copingStrategies.join(", ") || "—"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-panel mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">Coaching tips</h2>
            <button type="button" className="btn-secondary text-sm" onClick={() => void loadGuidance()}>
              Refresh with AI
            </button>
          </div>
          {guidance ? (
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-teal">Try this</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-foam/90">
                  {guidance.tryThis.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-coral">Avoid this</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-foam/90">
                  {guidance.avoidThis.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <p className="text-muted">{guidance.why}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Load AI guidance for supportive language.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl">Support board</h2>
          <p className="mt-2 text-sm text-muted">Open posts from people asking for a human.</p>
          <div className="mt-4 space-y-4">
            {posts.length === 0 && (
              <p className="card-panel p-5 text-muted">No open posts yet.</p>
            )}
            {posts.map((post) => (
              <article key={post._id} className="card-panel p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-teal">{post.authorAlias}</p>
                  <span className="text-xs text-muted">{post.status}</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Overview · triggers: {post.overview.triggers.join(", ") || "—"} · why:{" "}
                  {post.overview.motivations.join(", ") || "—"}
                </p>
                <p className="mt-3 text-foam">{post.content}</p>
                {post.replies?.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-line pt-3">
                    {post.replies.map((r, i) => (
                      <li key={`${r.companionAlias}-${i}`} className="text-sm">
                        <span className="text-sky">{r.companionAlias}:</span> {r.content}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex gap-2">
                  <input
                    className="input-dark flex-1"
                    placeholder="Write a supportive reply…"
                    value={replyDrafts[post._id] || ""}
                    onChange={(e) =>
                      setReplyDrafts((d) => ({ ...d, [post._id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => void reply(post._id)}
                  >
                    Reply
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-6 text-coral">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
