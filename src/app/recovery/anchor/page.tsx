"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnchorRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/help");
  }, [router]);
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <p className="text-muted">Opening Help Me Now…</p>
    </main>
  );
}
