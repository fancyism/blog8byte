# Tech Stack — Blog8byte

This document explains **each technology** chosen for the project and the reasoning ("Why") behind that decision.

---

## Core Framework

| Technology | Version | Role |
|---|---|---|
| **Next.js** | 15 (App Router) | Full-stack React framework. Handles SSR, API routes, routing, and static generation in a single codebase. |
| **React** | 19 | UI rendering layer. React 19 introduces Server Components as a first-class primitive, reducing client-side JS bundle size. |
| **TypeScript** | 5.8 | Static type safety across the entire codebase. Catches bugs at compile-time before they reach production. |

**Why Next.js 15 (App Router)?**
The App Router is the future of Next.js. It enables React Server Components (RSC), which means we can fetch data directly inside components without needing `getServerSideProps`. This results in less boilerplate and better performance.

---

## Database & ORM

| Technology | Version | Role |
|---|---|---|
| **Drizzle ORM** | 0.41 | Type-safe SQL query builder for PostgreSQL. |
| **PostgreSQL** (via `postgres` driver) | — | Primary relational database for blog content, comments, and user data. |
| **Docker Compose** | — | Runs a local PostgreSQL instance for development so no external service is needed. |

**Why Drizzle instead of Prisma?**
Drizzle is closer to raw SQL while still being fully type-safe. It generates zero runtime overhead (no query engine binary), produces leaner bundles, and gives full control over the queries — critical for a production system where performance predictability matters.

---

## Authentication

| Technology | Version | Role |
|---|---|---|
| **NextAuth.js (Auth.js)** | 5.0-beta | Handles OAuth, session management, and user authentication. |
| **@auth/drizzle-adapter** | 1.7 | Connects NextAuth sessions/accounts to the Drizzle ORM schema. |

**Why NextAuth v5 Beta?**
v5 is a ground-up rewrite designed for the Next.js App Router. It runs entirely on the Edge Runtime, supports RSC natively, and simplifies the configuration compared to v4.

---

## Validation & Safety

| Technology | Version | Role |
|---|---|---|
| **Zod** | 3.24 | Runtime schema validation for API request bodies and environment variables. |
| **@t3-oss/env-nextjs** | 0.12 | Type-safe environment variable validation. The server refuses to start if a critical `.env` key is missing. |

**Why Zod at the boundary?**
TypeScript disappears at runtime. Zod acts as a "security guard" at every API entry point, parsing and validating incoming data before it touches the business logic or database. Malformed payloads are rejected immediately with structured error messages.

---

## Styling

| Technology | Version | Role |
|---|---|---|
| **Tailwind CSS** | 4.0 | Utility-first CSS framework. Enables rapid, consistent styling with zero unused CSS in production builds. |

**Why Tailwind over CSS Modules or Styled-Components?**
Tailwind eliminates context-switching between HTML and CSS files. With the purge/JIT engine, the production CSS bundle is extremely small. It also pairs perfectly with our design system tokens (see `docs/DESIGN.md`).

---

## Code Quality & Developer Experience

| Technology | Role |
|---|---|
| **ESLint** | Static analysis to catch code errors and enforce style rules. |
| **Prettier** | Opinionated code formatter — eliminates all formatting debates. |
| **Husky** | Git hooks manager. Triggers quality checks before every commit. |
| **lint-staged** | Runs ESLint and Prettier only on staged files to keep pre-commit hooks fast. |
| **Vitest** | Unit/integration testing framework, compatible with the Vite ecosystem for fast test execution. |

---

## Development Workflow

| Tool | Role |
|---|---|
| **pnpm** | Package manager. Faster and more disk-efficient than npm/yarn via content-addressable storage. |
| **Turbopack** (`next dev --turbo`) | Rust-based bundler for near-instant HMR during development. |
| **Drizzle Kit** | Schema migration CLI. Generates SQL migration files from the TypeScript schema. |
| **Docker Compose** | One command (`docker compose up`) spins up the entire local infrastructure (PostgreSQL). |
