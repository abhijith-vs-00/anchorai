import { describe, expect, it } from "vitest";
import { classifyText, classifyEntryReason } from "@/lib/safety/classifier";

describe("safety classifier", () => {
  it("escalates clear urgent language", () => {
    const result = classifyText("I want to kill myself");
    expect(result.escalate).toBe(true);
    expect(result.level).toBe("urgent");
  });

  it("treats empty input as ok", () => {
    expect(classifyText("").level).toBe("ok");
    expect(classifyText(null).escalate).toBe(false);
  });

  it("escalates urgent_help entry reason", () => {
    expect(classifyEntryReason("urgent_help").escalate).toBe(true);
  });

  it("does not escalate calm_down", () => {
    expect(classifyEntryReason("calm_down").escalate).toBe(false);
  });
});
