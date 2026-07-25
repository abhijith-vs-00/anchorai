/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, prefetch: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import HomePage from "@/app/home/page";

afterEach(() => {
  cleanup();
});

describe("HomePage feature visibility", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("renders core paths and talk/timer features", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          user: {
            alias: "Phoenix",
            username: "phoenix_demo",
            role: "recoverer",
            onboardingCompleted: true,
            isDemo: true,
          },
        },
      }),
    }) as unknown as typeof fetch;

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/hello, phoenix/i)).toBeTruthy();
    });

    expect(document.querySelector('a[href="/blueprint"]')).toBeTruthy();
    expect(document.querySelector('a[href="/help"]')).toBeTruthy();
    expect(document.querySelector('a[href="/after"]')).toBeTruthy();
    expect(document.querySelector('a[href="/help?mode=ai"]')).toBeTruthy();
    expect(document.querySelector('a[href="/help?mode=human"]')).toBeTruthy();
    expect(document.querySelector('a[href="/help?mode=timer"]')).toBeTruthy();
    expect(screen.getAllByText(/talk to anchor ai/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/i need a human/i).length).toBeGreaterThan(0);
  });
});
