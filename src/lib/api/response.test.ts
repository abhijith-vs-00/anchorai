import { describe, expect, it } from "vitest";
import { ok, fail, serverError } from "@/lib/api/response";

describe("API response helpers", () => {
  it("ok returns success envelope", async () => {
    const res = ok({ hello: "world" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { hello: "world" } });
  });

  it("fail returns error envelope with status", async () => {
    const res = fail("VALIDATION_ERROR", "Bad input", 422);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Bad input");
  });

  it("serverError is 500 INTERNAL_ERROR", async () => {
    const res = serverError();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
