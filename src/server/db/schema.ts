import { relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

type AuthAccountType = "oauth" | "oidc" | "email" | "webauthn";

/**
 * Multi-project schema prefix — all tables prefixed with `blog8byte_`
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `blog8byte_${name}`);

// ============================================================
// Users (NextAuth + Role-Based Access)
// ============================================================

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({ mode: "date", withTimezone: true })
    .$defaultFn(() => new Date()),
  image: d.varchar({ length: 255 }),
  passwordHash: d.varchar({ length: 255 }),
  role: d.varchar({ length: 50 }).notNull().default("user"),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  blogs: many(blogs),
}));

// ============================================================
// NextAuth Tables (accounts, sessions, verificationTokens)
// ============================================================

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AuthAccountType>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ============================================================
// Blogs
// ============================================================

export const blogs = createTable(
  "blog",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    title: d.varchar({ length: 200 }).notNull(),
    slug: d.varchar({ length: 100 }).notNull(),
    excerpt: d.varchar({ length: 500 }),
    content: d.text().notNull(),
    coverImage: d.varchar({ length: 500 }),
    status: d
      .varchar({ length: 20 })
      .notNull()
      .default("draft"),
    viewCount: d.integer().notNull().default(0),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    publishedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    uniqueIndex("blog_slug_idx").on(t.slug),
    index("blog_status_published_idx").on(t.status, t.publishedAt),
    index("blog_created_by_idx").on(t.createdById),
    index("blog_created_at_idx").on(t.createdAt),
  ],
);

export const blogsRelations = relations(blogs, ({ one, many }) => ({
  author: one(users, { fields: [blogs.createdById], references: [users.id] }),
  images: many(blogImages),
  comments: many(comments),
}));

// ============================================================
// Blog Images (max 6 per blog, enforced at API layer)
// ============================================================

export const blogImages = createTable(
  "blog_image",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    blogId: d
      .integer()
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    url: d.varchar({ length: 500 }).notNull(),
    alt: d.varchar({ length: 255 }),
    displayOrder: d.integer().notNull().default(0),
  }),
  (t) => [index("blog_image_blog_id_idx").on(t.blogId)],
);

export const blogImagesRelations = relations(blogImages, ({ one }) => ({
  blog: one(blogs, { fields: [blogImages.blogId], references: [blogs.id] }),
}));

// ============================================================
// Comments (with reply thread via parentId)
// ============================================================

export const comments = createTable(
  "comment",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    blogId: d
      .integer()
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    parentId: d.integer(),
    authorName: d.varchar({ length: 100 }).notNull(),
    content: d.varchar({ length: 1000 }).notNull(),
    status: d
      .varchar({ length: 20 })
      .notNull()
      .default("pending"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("comment_blog_status_idx").on(t.blogId, t.status),
    index("comment_parent_idx").on(t.parentId),
    index("comment_created_at_idx").on(t.createdAt),
  ],
);

export const commentsRelations = relations(comments, ({ one, many }) => ({
  blog: one(blogs, { fields: [comments.blogId], references: [blogs.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
}));
