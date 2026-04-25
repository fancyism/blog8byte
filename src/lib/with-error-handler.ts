/**
 * @fileoverview Higher-order wrapper for Blog8byte API route handlers.
 *
 * @module lib/with-error-handler
 *
 * Wraps Next.js API route handlers with consistent error handling,
 * JSON parsing, and optional runtime request validation.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiBadRequest, apiInternalError } from "./api-response";

// Re-export api-response utilities for convenience
export {
  apiBadRequest,
  apiInternalError,
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiConflict,
} from "./api-response";

// ============================================================
// Error Codes
// ============================================================

/**
 * Standard error codes for API responses
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================================
// Request Parsing
// ============================================================

/**
 * Parse JSON body from request
 *
 * @param request - Next.js request object
 * @returns Parsed body or null on error
 */
export async function parseJsonBody<T>(
  request: NextRequest,
): Promise<{ success: true; data: T } | { success: false; error: Response }> {
  try {
    const data: T = await request.json() as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: apiBadRequest("Invalid JSON in request body"),
    };
  }
}

// ============================================================
// Higher-Order Handler
// ============================================================

/**
 * Handler options for withErrorHandler
 */
export interface HandlerOptions {
  /**
   * Zod schema for body validation
   */
  bodySchema?: z.ZodTypeAny;
  /**
   * Zod schema for query validation
   */
  querySchema?: z.ZodTypeAny;
  /**
   * Require authenticated session (check via session getter)
   */
  requireAuth?: boolean;
  /**
   * Require admin role
   */
  requireAdmin?: boolean;
}

/**
 * Context passed to wrapped handlers
 */
export interface HandlerContext<TBody = unknown, TQuery = unknown> {
  request: NextRequest;
  body: TBody;
  query: TQuery;
}

/**
 * Creates a higher-order handler with consistent error handling and validation
 *
 * @example
 * ```typescript
 * const handler = withErrorHandler(async (ctx) => {
 *   const { body } = ctx;
 *   // ... handler logic
 *   return apiSuccess({ created: true });
 * }, { bodySchema: createBlogSchema });
 * ```
 *
 * @param handler - Async route handler function
 * @param options - Validation and auth options
 * @returns Wrapped handler function
 */
export function withErrorHandler<TBody = unknown, TQuery = unknown>(
  handler: (context: HandlerContext<TBody, TQuery>) => Promise<Response>,
  options: HandlerOptions = {},
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      // Parse body if content-type is JSON
      let body: TBody = undefined as TBody;
      if (
        request.headers.get("content-type")?.includes("application/json")
      ) {
        const bodyResult = await parseJsonBody<TBody>(request);
        if (!bodyResult.success) {
          return bodyResult.error;
        }
        body = bodyResult.data;

        // Validate body if schema provided
        if (options.bodySchema) {
          const result = options.bodySchema.safeParse(body);
          if (!result.success) {
            return apiBadRequest("Validation failed", {
              errors: result.error.flatten().fieldErrors,
            });
          }
          body = result.data as TBody;
        }
      }

      // Parse and validate query params
      let query: TQuery = {} as TQuery;
      if (options.querySchema) {
        const url = new URL(request.url);
        const queryData = Object.fromEntries(url.searchParams);
        const result = options.querySchema.safeParse(queryData);
        if (!result.success) {
          return apiBadRequest("Invalid query parameters", {
            errors: result.error.flatten().fieldErrors,
          });
        }
        query = result.data as TQuery;
      }

      // TODO: Add session/auth checks here when auth is configured
      // if (options.requireAuth) { ... }
      // if (options.requireAdmin) { ... }

      // Execute handler with context
      return await handler({
        request,
        body,
        query,
      });
    } catch (error) {
      console.error("[withErrorHandler]", error);

      // Handle Zod errors specially
      if (error instanceof z.ZodError) {
        return apiBadRequest("Validation failed", {
          errors: error.flatten().fieldErrors,
        });
      }

      return apiInternalError(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  };
}

// ============================================================
// Shorthand Handlers
// ============================================================

/**
 * Creates a GET handler with optional query validation
 *
 * @param handler - GET handler function
 * @param querySchema - Optional Zod schema for query params
 * @returns Wrapped GET handler
 */
export function getHandler<TQuery = unknown>(
  handler: (context: HandlerContext<undefined, TQuery>) => Promise<Response>,
  querySchema?: z.ZodTypeAny,
) {
  return withErrorHandler<undefined, TQuery>(handler, { querySchema });
}

/**
 * Creates a POST handler with required body validation
 *
 * @param handler - POST handler function
 * @param bodySchema - Required Zod schema for request body
 * @returns Wrapped POST handler
 */
export function postHandler<TBody = unknown>(
  handler: (context: HandlerContext<TBody>) => Promise<Response>,
  bodySchema: z.ZodTypeAny,
) {
  return withErrorHandler<TBody>(handler, { bodySchema });
}

/**
 * Creates a PUT/PATCH/DELETE handler with ID param and body validation
 *
 * @param handler - Handler function
 * @param bodySchema - Optional Zod schema for request body
 * @returns Wrapped handler
 */
export function mutateHandler<TBody = unknown>(
  handler: (context: HandlerContext<TBody>) => Promise<Response>,
  bodySchema?: z.ZodTypeAny,
) {
  return withErrorHandler<TBody>(handler, {
    bodySchema: bodySchema ?? z.any().optional(),
  });
}