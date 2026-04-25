/**
 * @fileoverview Shared Zod validation schemas for Blog8byte API routes.
 *
 * @module lib/validation
 *
 * Single source of truth for request validation — used by both
 * withErrorHandler HOF and frontend forms.
 */

import { z } from "zod";

// ============================================================
// Custom Validators
// ============================================================

/**
 * Thai-only content regex: allows Thai characters, Arabic/Thai digits,
 * spaces, and newlines. Rejects English, emoji, and special characters.
 */
const THAI_CONTENT_REGEX = /^[\u0E00-\u0E7F0-9\u0E50-\u0E59\s\n]+$/;

// ============================================================
// Base Schemas
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const blogStatusEnum = z.enum(["draft", "published", "unpublished"]);
export const commentStatusEnum = z.enum(["pending", "approved", "rejected"]);

export const imageUrlSchema = z
  .union([z.string().url(), z.string().startsWith("/")])
  .optional();

// ============================================================
// Blog Schemas
// ============================================================

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  content: z.string().min(1, "Content is required").max(50000),
  excerpt: z.string().max(500).optional(),
  coverImage: imageUrlSchema,
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(255).optional(),
        displayOrder: z.number().int().min(0).default(0),
      }),
    )
    .max(6, "Maximum 6 images allowed")
    .optional(),
  status: blogStatusEnum.optional().default("draft"),
});

export const updateBlogSchema = createBlogSchema.partial();

export const updateBlogStatusSchema = z.object({
  status: blogStatusEnum,
});

export const blogListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: blogStatusEnum.optional(),
});

export const blogSlugSchema = z.object({
  slug: z.string().min(1),
});

// ============================================================
// Comment Schemas
// ============================================================

export const createCommentSchema = z.object({
  authorName: z
    .string()
    .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(100, "ชื่อยาวเกินไป"),
  content: z
    .string()
    .min(1, "กรุณาใส่ข้อความ")
    .max(1000, "ข้อความยาวเกินกำหนด (สูงสุด 1,000 ตัวอักษร)")
    .regex(THAI_CONTENT_REGEX, "ใส่ได้เฉพาะภาษาไทยและตัวเลขเท่านั้น"),
  parentId: z.number().int().positive().optional(),
});

export const updateCommentStatusSchema = z.object({
  status: commentStatusEnum,
});

export const commentListQuerySchema = paginationSchema.extend({
  status: commentStatusEnum.optional(),
  blogId: z.coerce.number().int().positive().optional(),
});

// ============================================================
// Auth Schemas
// ============================================================

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// ============================================================
// Type Exports
// ============================================================

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type UpdateBlogStatusInput = z.infer<typeof updateBlogStatusSchema>;
export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentStatusInput = z.infer<typeof updateCommentStatusSchema>;
export type CommentListQuery = z.infer<typeof commentListQuerySchema>;

// ============================================================
// Helpers
// ============================================================

export function getPaginationMeta(page: number, limit: number, total: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}