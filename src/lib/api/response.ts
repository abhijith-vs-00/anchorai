import { NextResponse } from "next/server";
import type { ApiFailure, ApiSuccess } from "@/types";

export function ok<T>(data: T, init?: ResponseInit) {
  const body: ApiSuccess<T> = { success: true, data };
  return NextResponse.json(body, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  init?: ResponseInit
) {
  const body: ApiFailure = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status, ...init });
}

export function serverError(message = "Something went wrong. Please try again.") {
  return fail("INTERNAL_ERROR", message, 500);
}
