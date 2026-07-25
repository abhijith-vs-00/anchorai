"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — redirect to new recoverer home */
export default function RecoveryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home");
  }, [router]);
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <p className="text-muted">Taking you home…</p>
    </main>
  );
}
