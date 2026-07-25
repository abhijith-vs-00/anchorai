import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  normalizeUsername,
  isValidUsername,
  isValidEmail,
} from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("AnchorDemo1!");
    expect(hash).not.toBe("AnchorDemo1!");
    expect(await verifyPassword("AnchorDemo1!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("normalizes usernames", () => {
    expect(normalizeUsername("  Phoenix 27 ")).toBe("phoenix_27");
  });

  it("validates usernames", () => {
    expect(isValidUsername("phoenix_demo")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("Bad Name!")).toBe(false);
  });

  it("validates emails", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });
});
