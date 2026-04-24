import { NextResponse } from "next/server";

// ============================================================
// Shared API Response Helpers
// ============================================================

type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL_ERROR";

/**
 * Standard success response
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta && { meta }) });
}

/**
 * Standard error response
 */
export function apiError(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: { code, message, ...(details && { details }) } },
    { status },
  );
}

/**
 * 400 — Validation Error
 */
export function apiBadRequest(message: string, details?: Record<string, unknown>) {
  return apiError("VALIDATION_ERROR", message, 400, details);
}

/**
 * 401 — Unauthorized
 */
export function apiUnauthorized(message = "Authentication required") {
  return apiError("UNAUTHORIZED", message, 401);
}

/**
 * 403 — Forbidden
 */
export function apiForbidden(message = "Access denied") {
  return apiError("FORBIDDEN", message, 403);
}

/**
 * 404 — Not Found
 */
export function apiNotFound(message = "Resource not found") {
  return apiError("NOT_FOUND", message, 404);
}

/**
 * 409 — Conflict
 */
export function apiConflict(message: string) {
  return apiError("CONFLICT", message, 409);
}

/**
 * 500 — Internal Server Error
 */
export function apiInternalError(message = "Internal server error") {
  return apiError("INTERNAL_ERROR", message, 500);
}
