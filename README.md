# Blog8byte 🏴‍☠️

A high-performance, production-ready blogging platform built with **Next.js 15 (App Router)** and **TypeScript**.

This project was engineered with a strict focus on **Shift-Left Security**, **Runtime Validation**, and a highly optimized **Editorial UI Design**. It serves as a showcase for enterprise-grade architectural patterns and modern frontend best practices.

---

## 📚 Documentation & Specifications

For a deep dive into the engineering decisions and UI/UX guidelines, please refer to our internal documentation:

- [Architecture & Patterns (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md): Details on Security, Zod Runtime Validation, and HOF implementations.
- [Design System (`docs/DESIGN.md`)](./docs/DESIGN.md): The "Earth Tone Editorial" specifications and Tailwind token references.
- [Assumptions & Boundaries (`docs/ASSUMPTIONS.md`)](./docs/ASSUMPTIONS.md): Project constraints, local infrastructure rules, and specific assignment boundaries.

---

## ✨ Architectural Highlights & "Smart Moves"

### 1. Shift-Left Security (Infrastructure Level)

Security shouldn't be an afterthought. By configuring strict security headers directly in `next.config.js`, the application is shielded against common web vulnerabilities (Clickjacking, MIME Sniffing, XSS) at the infrastructure level with zero runtime cost.

- Strict-Transport-Security (HSTS)
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)

### 2. Defensive Programming with Runtime Validation (Zod)

TypeScript provides compile-time safety, but real-world systems fail at runtime boundaries.

- **Environment Variables:** Strictly validated on server start using `T3-Env` concepts. The app refuses to boot if critical keys are missing.
- **API Boundaries:** Every incoming API request body is intercepted and parsed against a Zod schema (`src/lib/validation.ts`). Malformed data is rejected before it ever reaches the core business logic or database.

### 3. Centralized Error Handling (HOF Pattern)

To maintain DRY principles and keep API routes readable, a Higher-Order Function (HOF) wrapper (`withErrorHandler`) is utilized.

- It catches unhandled exceptions globally.
- Standardizes HTTP error responses (e.g., 400 for validation errors, 500 for internal crashes).
- Reduces repetitive `try/catch` boilerplate across the codebase.

### 4. Automated Quality Gates

A clean Git history is maintained using **Husky** and **lint-staged**.

- Pre-commit hooks automatically run Prettier and ESLint.
- Code that fails formatting or linting rules cannot be committed, ensuring that 100% of the code entering the repository meets team standards.

### 5. Localization & Data Integrity 🇹🇭

Designed to support the Thai localization requirements from the start:

- Custom Zod schemas combined with specific Regex rules ensure accurate parsing and validation of Thai characters and localized numerical inputs, effectively eliminating garbage data issues.
- **Example (Comment Validation):** We use a strict Unicode Regex (`/^[\u0E00-\u0E7F0-9\u0E50-\u0E59\s\n]+$/`) injected into Zod to completely block English spam, emojis, and special characters, allowing only valid Thai consonants, vowels, and digits.

### 6. Content Moderation & RBAC 👮

Built-in Role-Based Access Control (RBAC) handles workflow constraints:

- Comments and specific blog entries go through an **Admin Approval Workflow** (Pending -> Approved/Rejected), supported directly at the database schema level (`status` enums in Drizzle).

### 7. Strict Local Infrastructure & Tooling 📦

To completely eliminate the "It works on my machine" problem:

- **Package Manager:** Forced usage of `pnpm` (via Corepack) for deterministic and disk-space-efficient dependency resolution.
- **Database:** Local environment relies exclusively on `docker-compose.yml` to spin up PostgreSQL, requiring zero manual database engine installations.

### 8. Enterprise-Grade Database Architecture & Performance 🏛️

The database leverages **PostgreSQL** with **Drizzle ORM** for maximum type-safety and raw performance, deliberately avoiding heavy ORMs like Prisma.

**Smart Moves & Indexing Strategy:**
- **Multi-project Schema Prefixing:** Uses `pgTableCreator` to prefix all tables (e.g., `blog8byte_users`). This enterprise pattern ensures safe deployment to shared serverless databases (like Vercel Postgres or Neon) without table collisions.
- **B-Tree Indexing on Read-Heavy Paths:** 
  - `blog_slug_idx`: Enables instant O(log n) direct lookups for the main public blog pages.
  - `blog_status_published_idx`: Pre-sorts published blogs, ensuring lightning-fast feed pagination.
  - `comment_blog_status_idx`: Retrieves only `approved` comments per blog without scanning pending spam.

**Core Entities & Workflows:**
- **Users & Auth:** Integrates NextAuth.js standard tables with an added `role` field for absolute Role-Based Access Control (RBAC) at the database level.
- **Content Management:** The `blogs` table tracks `status` (draft, published) and separates `createdAt` from `publishedAt` to support a true Editorial Workflow. Images are decoupled into `blogImages` (One-to-Many) with `displayOrder`.
- **Comments (Infinite Threading):** Uses a self-referencing relationship (`parentId`) for infinitely nested replies. Every comment defaults to a `pending` status.
- **Data Flow Highlights:**
  1. **Public Read Flow:** RSC -> Drizzle hits `blog_slug_idx` -> Fetches approved comments -> Renders static HTML instantly.
  2. **Secure Comment Flow:** User submits -> Zod Runtime Validation (Thai-only) -> DB inserts as `pending` (Invisible to public).
  3. **Editorial Workflow:** Admin Dashboard -> Queries `pending` comments -> Admin approves -> Status updates to `approved` -> Appears live.

---

## 🎨 Design System: "Earth Tone Editorial"

The UI breaks away from generic component libraries, drawing inspiration from minimalist, high-end editorial platforms (like Pirate Wires) but utilizing an organic **Earth Tone palette**.

- **Typography-First:** Relies heavily on Geist/Inter for stark, legible layouts.
- **Micro-Interactions:** Reduces visual clutter by hiding secondary metadata (like publish dates). These elements elegantly fade in (`opacity-0` to `opacity-100`) only on user hover.
- **Color Palette:**
  - Background: Warm Cream (`#FDFBF7`) to reduce eye strain.
  - Text: Deep Charcoal (`#27272A`).
  - Accents: Sage Green (`#849C8A`) and Terracotta (`#C87965`).

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Prerequisites

Ensure you have the following installed:

- Node.js (v18 or higher)
- pnpm (Recommended package manager)
- Docker (If running local databases)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd blog8byte
pnpm install
```

### 3. Environment Configuration

Duplicate the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

*(Note: If you miss a required variable, the Zod runtime validation will throw an error immediately upon startup to warn you).*

Generate and set `AUTH_SECRET` before running the app:

```bash
npx auth secret
```

`AUTH_SECRET` is required in local development too because the app uses Auth.js middleware with JWT sessions.

The default local database URL is:

```bash
postgresql://postgres:password@localhost:5432/blog8byte
```

This matches the bundled `docker-compose.yml`.

### 4. Start PostgreSQL

Start the local database before running the app:

```bash
docker compose up -d db
```

If you previously created the database container with older settings, reset it first with `docker compose down -v` so Docker recreates the database with the current credentials and database name.

### 5. Push the Schema and Seed the Admin User

Create the tables and the default admin account:

```bash
pnpm db:push
pnpm db:seed
```

The seeded admin credentials come from `.env` (or default to these values if not set):

- **Email:** `admin@blog8byte.com`
- **Password:** `admin1234`

### 6. Run the Development Server

Start the Next.js development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript (Strict Mode)
- **Database & ORM:** PostgreSQL + Drizzle ORM
- **Authentication:** NextAuth v5 (Auth.js)
- **Styling:** Tailwind CSS + shadcn/ui
- **Validation:** Zod
- **Testing:** Vitest
- **Linting & Formatting:** ESLint, Prettier, Husky, lint-staged
