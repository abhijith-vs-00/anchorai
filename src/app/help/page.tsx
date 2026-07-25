"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Mode = "menu" | "timer" | "strategies" | "ai" | "human" | "urgent";

type EmergencyOption = {
  id: string;
  label: string;
  description: string;
  href?: string;
  type: string;
};

const TIMER_SECONDS = 180;

const STRATEGIES = [
  { id: "urge", label: "Surf this urge", reason: "urge" },
  { id: "calm", label: "Help me calm down", reason: "calm_down" },
  { id: "leave", label: "Leave this situation", reason: "leave_situation" },
  { id: "blank", label: "I can't explain", reason: "cant_explain" },
];

function HelpInner() {
  const params = useSearchParams();
  const initialMode = (params.get("mode") as Mode | null) || "menu";
  const validInitial: Mode =
    initialMode === "timer" || initialMode === "ai" || initialMode === "human"
      ? initialMode
      : "menu";

  const [mode, setMode] = useState<Mode>(validInitial);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [running, setRunning] = useState(validInitial === "timer");
  const [taps, setTaps] = useState(0);
  const [chatId, setChatId] = useState<string | undefined>();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [postText, setPostText] = useState("");
  const [postDone, setPostDone] = useState(false);
  const [emergency, setEmergency] = useState<EmergencyOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [strategySteps, setStrategySteps] = useState<
    { text: string; options?: string[] }[]
  >([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [interventionId, setInterventionId] = useState<string | null>(null);
  const [boardPreview, setBoardPreview] = useState<
    {
      authorAlias: string;
      content: string;
      replies: { companionAlias: string; content: string }[];
    }[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (validInitial === "timer") {
      setMode("timer");
      setRunning(true);
      setSecondsLeft(TIMER_SECONDS);
    } else if (validInitial === "ai" || validInitial === "human") {
      setMode(validInitial);
    }
  }, [validInitial]);

  useEffect(() => {
    if (mode !== "human") return;
    (async () => {
      try {
        const res = await fetch("/api/support?scope=mine");
        const json = await res.json();
        if (json.success) {
          setBoardPreview(json.data.posts?.slice(0, 3) || []);
        }
      } catch {
        // non-blocking
      }
    })();
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, []);

  function startTimer() {
    setMode("timer");
    setSecondsLeft(TIMER_SECONDS);
    setTaps(0);
    setRunning(true);
  }

  async function startStrategy(reason: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/interventions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryReason: reason, initialIntensity: 4 }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      if (json.data.escalate) {
        setEmergency(json.data.emergencyOptions || []);
        setMode("urgent");
        return;
      }
      setInterventionId(json.data.intervention._id);
      setStrategySteps(json.data.intervention.steps || []);
      setStepIndex(0);
      setMode("strategies");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendChat(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    const optimistic = [...messages, { role: "user", content: text.trim() }];
    setMessages(optimistic);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sessionId: chatId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Chat failed");
      setChatId(json.data.session?._id);
      setMessages([...optimistic, { role: "assistant", content: json.data.reply }]);
      speak(json.data.reply);
      if (json.data.escalate) {
        setEmergency(json.data.emergencyOptions || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    const SR =
      typeof window !== "undefined"
        ? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
            .webkitSpeechRecognition ||
          (window as unknown as { SpeechRecognition?: new () => SpeechRecognition })
            .SpeechRecognition
        : undefined;
    if (!SR) {
      setError("Voice input isn't supported in this browser. You can still type.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      void sendChat(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }

  async function postHuman() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          content: postText,
          isGeneral: true,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed");
      setPostDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function completeStrategy() {
    if (!interventionId) return;
    await fetch(`/api/interventions/${interventionId}/step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepIndex }),
    });
    if (stepIndex + 1 >= strategySteps.length) {
      await fetch(`/api/interventions/${interventionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: "a_little_better", finalIntensity: 2 }),
      });
      setMode("menu");
      setStrategySteps([]);
    } else {
      setStepIndex((s) => s + 1);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = ((TIMER_SECONDS - secondsLeft) / TIMER_SECONDS) * 100;

  return (
    <main className="bg-anchor-mode whoom-enter min-h-dvh text-foam">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
        {mode === "menu" && (
          <>
            <Link href="/home" className="text-sm text-muted hover:text-foam">
              ← Home
            </Link>
            <p className="font-display mt-8 text-4xl">I&apos;m here.</p>
            <p className="mt-3 text-lg text-muted">You don&apos;t need to explain everything.</p>

            <div className="mt-10 space-y-3">
              <button type="button" onClick={startTimer} className="btn-primary w-full py-5 text-lg">
                Start urge timer (3 min)
              </button>
              <button
                type="button"
                onClick={() => setMode("ai")}
                className="btn-secondary w-full py-4"
              >
                Talk with Anchor AI
              </button>
              <button
                type="button"
                onClick={() => setMode("human")}
                className="btn-secondary w-full py-4"
              >
                Ask a human companion
              </button>
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void startStrategy(s.reason)}
                  className="btn-secondary w-full py-4 text-left"
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                className="btn-danger w-full py-4"
                onClick={() => void startStrategy("urgent_help")}
              >
                I need urgent help
              </button>
            </div>
            {error && <p className="mt-4 text-coral">{error}</p>}
          </>
        )}

        {mode === "timer" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Link href="/home" className="self-start text-sm text-muted">
              ← Home
            </Link>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-teal">Urge surf</p>
            <p className="mt-3 max-w-xs text-muted">
              Stay with the feeling. Tap the circle each time the urge spikes — it will pass.
            </p>
            <button
              type="button"
              onClick={() => {
                setTaps((t) => t + 1);
                if (!running && secondsLeft > 0) setRunning(true);
              }}
              className="relative mt-12 flex h-56 w-56 items-center justify-center rounded-full border border-teal/40 bg-teal/10"
              aria-label="Tap when urge spikes"
            >
              <span
                className="timer-pulse absolute inset-0 rounded-full border-2 border-teal/50"
                aria-hidden
              />
              <span className="font-display text-5xl tabular-nums">
                {mm}:{ss}
              </span>
            </button>
            <div className="mt-8 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-teal transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-4 text-sm text-muted">Taps while surfing: {taps}</p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRunning((r) => !r)}
              >
                {running ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setRunning(false);
                  setMode("menu");
                }}
              >
                {secondsLeft === 0 ? "I made it" : "End early"}
              </button>
            </div>
          </div>
        )}

        {mode === "strategies" && strategySteps[stepIndex] && (
          <div>
            <p className="text-sm text-teal">
              Step {stepIndex + 1} / {strategySteps.length}
            </p>
            <p className="font-display mt-6 text-3xl leading-snug">
              {strategySteps[stepIndex].text}
            </p>
            {strategySteps[stepIndex].options?.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => void completeStrategy()}
                className="btn-secondary mt-3 w-full"
              >
                {opt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void completeStrategy()}
              className="btn-primary mt-8 w-full"
            >
              Continue
            </button>
          </div>
        )}

        {mode === "ai" && (
          <div className="flex min-h-0 flex-1 flex-col">
            <button
              type="button"
              className="text-left text-sm text-muted"
              onClick={() => setMode("menu")}
            >
              ← Back
            </button>
            <h1 className="font-display mt-4 text-3xl">Talk with Anchor</h1>
            <p className="mt-2 text-sm text-muted">Text or voice. Replies can be spoken aloud.</p>
            <div className="mt-6 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-line bg-black/30 p-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted">Say what&apos;s happening. I&apos;m listening.</p>
              )}
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user" ? "ml-8 bg-teal/20" : "mr-8 bg-white/5"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>
            {emergency.length > 0 && (
              <Link href="/after?urgent=1" className="mt-3 text-sm text-coral underline">
                Urgent support options available
              </Link>
            )}
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void sendChat(input);
              }}
            >
              <input
                className="input-dark flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={busy}
              />
              <button type="submit" className="btn-primary px-4" disabled={busy}>
                Send
              </button>
            </form>
            <button
              type="button"
              onClick={startVoice}
              className="btn-secondary mt-3 w-full"
              disabled={listening || busy}
            >
              {listening ? "Listening…" : "Speak instead"}
            </button>
            {error && <p className="mt-2 text-sm text-coral">{error}</p>}
          </div>
        )}

        {mode === "human" && (
          <div>
            <button type="button" className="text-sm text-muted" onClick={() => setMode("menu")}>
              ← Back
            </button>
            <h1 className="font-display mt-4 text-3xl">Ask a human</h1>
            <p className="mt-3 text-sm text-muted">
              Post to the companion board. Companions see your alias and a recovery overview — not
              your real identity.
            </p>

            {boardPreview.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal">
                  Ongoing conversations
                </p>
                {boardPreview.map((p, idx) => (
                  <article key={idx} className="rounded-2xl border border-line bg-white/5 p-4">
                    <p className="text-xs text-muted">{p.authorAlias}</p>
                    <p className="mt-1 text-sm">{p.content}</p>
                    {p.replies?.slice(0, 2).map((r, i) => (
                      <p key={i} className="mt-2 text-sm text-sky">
                        <span className="font-semibold">{r.companionAlias}:</span> {r.content}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            )}

            {postDone ? (
              <div className="card-panel mt-8 p-6">
                <p className="font-display text-2xl text-teal">Posted.</p>
                <p className="mt-2 text-muted">Companions can reply when they&apos;re available.</p>
                <Link href="/home" className="btn-primary mt-6 inline-flex">
                  Back home
                </Link>
              </div>
            ) : (
              <>
                <textarea
                  className="input-dark mt-6 min-h-36"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What do you need from a supportive human right now?"
                  maxLength={1000}
                />
                <button
                  type="button"
                  disabled={busy || !postText.trim()}
                  onClick={() => void postHuman()}
                  className="btn-primary mt-4 w-full disabled:opacity-50"
                >
                  {busy ? "Posting…" : "Post to companions"}
                </button>
                {error && <p className="mt-3 text-coral">{error}</p>}
              </>
            )}
          </div>
        )}

        {mode === "urgent" && (
          <div>
            <p className="font-display text-4xl">Get help now</p>
            <p className="mt-4 text-muted">
              Anchor isn&apos;t a replacement for professional emergency support.
            </p>
            <ul className="mt-8 space-y-3">
              {emergency.map((opt) => (
                <li key={opt.id} className="card-panel p-4">
                  {opt.href ? (
                    <a href={opt.href} target="_blank" rel="noopener noreferrer" className="block">
                      <span className="font-semibold">{opt.label}</span>
                      <span className="mt-1 block text-sm text-muted">{opt.description}</span>
                    </a>
                  ) : (
                    <>
                      <span className="font-semibold">{opt.label}</span>
                      <span className="mt-1 block text-sm text-muted">{opt.description}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <button type="button" className="btn-secondary mt-8" onClick={() => setMode("menu")}>
              Back
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-anchor-mode flex min-h-dvh items-center justify-center">
          <p className="text-muted">Loading…</p>
        </main>
      }
    >
      <HelpInner />
    </Suspense>
  );
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  start(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
