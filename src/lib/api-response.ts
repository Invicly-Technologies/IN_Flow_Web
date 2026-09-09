import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function apiSuccess<T>(
  data: T,
  init?: { meta?: Record<string, unknown>; status?: number }
) {
  return NextResponse.json(
    { success: true, data, meta: init?.meta ?? {} },
    { status: init?.status ?? 200 }
  );
}

export class ApiError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function apiError(code: ApiErrorCode, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status: STATUS_BY_CODE[code] }
  );
}

/** Wrap a route handler so thrown ApiError/ZodError produce a consistent envelope. */
export function toErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return apiError(err.code, err.message);
  }
  if (err instanceof Error && err.name === "ZodError") {
    return apiError("VALIDATION_ERROR", err.message);
  }
  console.error(err);
  return apiError("INTERNAL_ERROR", "Something went wrong");
}
