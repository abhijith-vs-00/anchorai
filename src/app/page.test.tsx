/** @vitest-environment jsdom */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
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

import LandingPage from "@/app/page";

afterEach(() => {
  cleanup();
});

describe("LandingPage", () => {
  it("shows auth and see-how-it-works actions", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { name: /get started/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /^log in$/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /^sign up$/i })).toBeTruthy();
    expect(screen.getByText(/see how it works/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /see as recoverer/i })
    ).toBeTruthy();
  });

  it("shows pitch test account usernames", () => {
    render(<LandingPage />);
    expect(screen.getByText("phoenix_demo")).toBeTruthy();
    expect(screen.getByText("care_demo")).toBeTruthy();
  });

  it("demo recoverer button triggers auth request", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: { user: { role: "recoverer" } },
      }),
    }) as unknown as typeof fetch;

    render(<LandingPage />);
    await user.click(screen.getByRole("button", { name: /see as recoverer/i }));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth",
      expect.objectContaining({ method: "POST" })
    );
  });
});
