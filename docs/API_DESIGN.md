# Blog8byte: API Design

เอกสารนี้ครอบคลุม **Phase 2: API Design** ทั้งหมดตาม Production-Ready Checklist — ทั้ง Endpoint Spec, Error Handling, และ Auth/Authz Strategy

---

## 1. 📐 Design Principles (หลักการออกแบบ)

ก่อนดู endpoint ทุกตัว ต้องเข้าใจ "กฎ" ที่ทุก API ใน project นี้ต้องทำตาม:

| หลักการ | ความหมาย |
|---|---|
| **Consistent Response Shape** | ทุก endpoint คืนรูปแบบเดียวกัน — ทายได้ว่า field อะไรอยู่ตรงไหน |
| **Fail Fast** | validate input ที่ API boundary ทันที ก่อนถึง DB หรือ business logic |
| **Least Privilege** | Public API รู้แค่ที่จำเป็น (ไม่ expose internal ID / passwordHash) |
| **Semantic HTTP Status** | ใช้ status code ถูกต้อง ไม่ return 200 พร้อม error message |
| **Separation of Concerns** | Route handler ไม่มี business logic — delegate ไปที่ service layer |

---

## 2. 📦 Response Format (รูปแบบ Response มาตรฐาน)

### ✅ Success — Single Resource

```json
{
  "data": { ... }
}
```

### ✅ Success — Collection (List + Pagination)

```json
{
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### ❌ Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "content", "message": "ใส่ได้เฉพาะภาษาไทยและตัวเลขเท่านั้น" }
    ]
  }
}
```

> **กฎ:** `details` เป็น optional — ส่งมาเฉพาะ validation error เท่านั้น, server error ไม่ต้อง expose

---

## 3. 🌐 Public API Endpoints (ไม่ต้อง Auth)

### `GET /api/blogs`

**วัตถุประสงค์:** List blog ที่ publish แล้ว, รองรับ search และ pagination

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | number | ❌ | `1` | หน้าที่ต้องการ |
| `limit` | number | ❌ | `10` | จำนวนต่อหน้า (max: 50) |
| `search` | string | ❌ | — | ค้นหาจาก title (case-insensitive) |

**Filter ที่ backend enforce เสมอ:** `status = "published"` — user ไม่สามารถ override ได้

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "เริ่มต้นกับ Next.js 15",
      "slug": "getting-started-nextjs-15",
      "excerpt": "Next.js 15 มาพร้อมฟีเจอร์ใหม่...",
      "coverImage": "https://...",
      "viewCount": 234,
      "commentCount": 12,
      "publishedAt": "2026-04-01T09:00:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

> **Design Decision:** ไม่ return `content` ใน list view — ลด payload size, client ต้องเปิด detail เองถึงจะได้ full content

---

### `GET /api/blogs/:slug`

**วัตถุประสงค์:** ดึง blog detail พร้อม approved comments และ increment viewCount

**Path Parameter:** `slug` — unique string identifier ของ blog (ไม่ใช่ numeric ID)

> **ทำไมใช้ slug แทน ID?**
> - SEO-friendly URL (`/blogs/my-article` ดีกว่า `/blogs/42`)
> - ถ้าใช้ ID แล้วมีคนเดา ID อื่นก็ได้ข้อมูล slug บังคับ unique จึงปลอดภัยกว่า
> - เปลี่ยน content ได้โดยไม่ต้องเปลี่ยน URL

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "title": "เริ่มต้นกับ Next.js 15",
    "slug": "getting-started-nextjs-15",
    "content": "...(full markdown content)...",
    "coverImage": "https://...",
    "images": [
      { "url": "https://...", "order": 1, "alt": "รูปที่ 1" }
    ],
    "viewCount": 235,
    "publishedAt": "2026-04-01T09:00:00Z",
    "comments": [
      {
        "id": 5,
        "authorName": "สมชาย",
        "content": "บทความดีมากครับ",
        "createdAt": "2026-04-02T10:00:00Z"
      }
    ]
  }
}
```

**Side Effects:**
- `viewCount + 1` ทุกครั้งที่เรียก endpoint นี้ (fire-and-forget, ไม่ block response)
- `comments` filter เฉพาะ `status = "approved"` เท่านั้น

**Error Cases:**
- `404` — slug ไม่มีใน DB
- `404` — blog มีอยู่แต่ status ไม่ใช่ `"published"` (ป้องกัน draft/unpublished leak)

---

### `POST /api/blogs/:slug/comments`

**วัตถุประสงค์:** ส่ง comment ใหม่ — comment จะอยู่ใน `pending` state รอ admin approve

**Request Body:**
```json
{
  "authorName": "สมชาย",
  "content": "บทความดีมากครับ อ่านเข้าใจง่าย"
}
```

**Validation Rules (enforce ทั้ง frontend + backend):**

| Field | Rule |
|---|---|
| `authorName` | required, 2–100 chars |
| `content` | required, ภาษาไทย + ตัวเลข (0-9, ๐-๙) + เว้นวรรค + ขึ้นบรรทัดใหม่ เท่านั้น |
| `content` | ห้าม: ภาษาอังกฤษ, emoji, special characters |
| `content` | max: 1,000 chars |

**Regex Pattern สำหรับ content:**
```
^[\u0E00-\u0E7F0-9๐-๙\s\n]+$
```

**Response (201):**
```json
{
  "data": {
    "message": "ส่ง comment สำเร็จ รอการตรวจสอบจาก admin"
  }
}
```

> **Design Decision:** ไม่ return comment object กลับไป เพราะ status จะเป็น `pending` เสมอ ไม่มีประโยชน์ที่ client จะ render ทันที

**Error Cases:**
- `400` — validation fail (พร้อม field-level details)
- `404` — slug ไม่มี หรือ blog ไม่ใช่ `"published"`

---

## 4. 🔐 Admin API Endpoints (ต้อง Auth)

> ทุก endpoint ใน section นี้ต้องผ่าน auth middleware ก่อน — ถ้าไม่มี valid session → `401 Unauthorized` ทันที

---

### `POST /api/auth/login`

**วัตถุประสงค์:** Admin เข้าสู่ระบบด้วย email + password

**Request Body:**
```json
{
  "email": "admin@blog8byte.com",
  "password": "secret"
}
```

**Response (200):**
```json
{
  "data": {
    "message": "Login successful"
  }
}
```

> **Session:** ใช้ httpOnly cookie (ผ่าน NextAuth) — ไม่ return token ใน body เพื่อป้องกัน XSS

**Error Cases:**
- `400` — missing email/password
- `401` — email ไม่มีใน DB หรือ password ไม่ตรง

> **Security Note:** ต้อง return error message เดียวกันทั้ง 2 กรณี (`"Invalid credentials"`) เพื่อป้องกัน user enumeration attack

---

### `GET /api/admin/blogs`

**วัตถุประสงค์:** List blog ทุกตัว (ทุก status: draft, published, unpublished)

**Query Parameters:** เหมือน Public API แต่ไม่มี status filter — admin เห็นทุกอย่าง

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "...",
      "slug": "...",
      "status": "published",
      "viewCount": 234,
      "commentCount": 12,
      "createdAt": "2026-04-01T09:00:00Z",
      "updatedAt": "2026-04-10T14:00:00Z"
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 10, "totalPages": 2 }
}
```

---

### `PUT /api/admin/blogs/:id`

**วัตถุประสงค์:** แก้ไข blog (ใช้ numeric `id` ไม่ใช่ slug เพราะ slug อาจเปลี่ยนได้)

**Request Body:**
```json
{
  "title": "ชื่อใหม่",
  "slug": "new-slug",
  "excerpt": "...",
  "content": "...",
  "coverImage": "https://...",
  "images": [
    { "url": "https://...", "order": 1, "alt": "..." }
  ]
}
```

**Fields ที่ห้ามแก้ไข (read-only, backend enforce):**

| Field | เหตุผล |
|---|---|
| `createdAt` | Immutable timestamp |
| `viewCount` | ระบบจัดการเอง (ป้องกัน manipulation) |
| `publishedAt` | Set ครั้งแรกที่ publish, immutable หลังจากนั้น |

**Validation:**
- `slug` ต้อง unique (ถ้าซ้ำกับ blog อื่น → `409 Conflict`)
- `images` array ไม่เกิน 6 items (ไม่นับ `coverImage`)

**Response (200):** คืน blog ที่อัปเดตแล้ว

---

### `PATCH /api/admin/blogs/:id/publish`

**วัตถุประสงค์:** Toggle สถานะ publish/unpublish

**Request Body:**
```json
{
  "status": "published"
}
```

**State Machine:**
```
draft        → published   ✅  (ครั้งแรก publish → set publishedAt)
published    → unpublished ✅  (ซ่อนจาก public)
unpublished  → published   ✅  (เปิดอีกครั้ง — publishedAt ไม่เปลี่ยน)
published    → draft       ❌  (ห้าม — draft หมายถึงยังไม่เคย publish)
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "status": "published",
    "publishedAt": "2026-04-01T09:00:00Z"
  }
}
```

---

### `GET /api/admin/blogs/:id/comments`

**วัตถุประสงค์:** ดู comment ทุกตัวของ blog (pending, approved, rejected)

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | `pending \| approved \| rejected` | filter by status (optional) |
| `page` | number | pagination |
| `limit` | number | pagination |

**Response (200):**
```json
{
  "data": [
    {
      "id": 5,
      "authorName": "สมชาย",
      "content": "บทความดีมากครับ",
      "status": "pending",
      "createdAt": "2026-04-02T10:00:00Z"
    }
  ],
  "meta": { "total": 8, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### `PATCH /api/admin/comments/:id`

**วัตถุประสงค์:** Approve หรือ Reject comment

**Request Body:**
```json
{
  "status": "approved"
}
```

**Valid Transitions:**

| จาก | ไป | อนุญาต? |
|---|---|---|
| `pending` | `approved` | ✅ |
| `pending` | `rejected` | ✅ |
| `approved` | `rejected` | ✅ (admin เปลี่ยนใจได้) |
| `rejected` | `approved` | ✅ (admin เปลี่ยนใจได้) |
| `approved` | `approved` | ❌ (no-op, return 400) |

**Response (200):**
```json
{
  "data": {
    "id": 5,
    "status": "approved"
  }
}
```

---

### `DELETE /api/admin/comments/:id`

**วัตถุประสงค์:** ลบ comment ถาวร (hard delete)

**Response (200):**
```json
{
  "data": {
    "message": "Comment deleted"
  }
}
```

> **Assumption:** ใช้ hard delete เพราะ comment ไม่มี audit requirement — ถ้าต้องการ audit trail ในอนาคตให้ switch เป็น soft delete (เพิ่ม `deletedAt` column)

---

## 5. ⚠️ Error Handling Strategy

### HTTP Status Code Reference

| Status | Code | เมื่อไหร่ |
|---|---|---|
| `200` | OK | success (GET, PUT, PATCH, DELETE) |
| `201` | Created | สร้างสำเร็จ (POST) |
| `400` | Bad Request | validation fail, invalid body |
| `401` | Unauthorized | ไม่มี session / invalid credentials |
| `403` | Forbidden | มี session แต่ไม่มีสิทธิ์ |
| `404` | Not Found | resource ไม่มีใน DB |
| `409` | Conflict | slug ซ้ำ, unique constraint fail |
| `422` | Unprocessable Entity | business rule violation (เช่น images > 6) |
| `500` | Internal Server Error | unexpected error (ไม่ expose details) |

### Error Code Enum

```typescript
type ErrorCode =
  | "VALIDATION_ERROR"      // input ไม่ผ่าน Zod schema
  | "NOT_FOUND"             // resource ไม่มี
  | "UNAUTHORIZED"          // ต้อง login ก่อน
  | "FORBIDDEN"             // ไม่มีสิทธิ์
  | "CONFLICT"              // slug ซ้ำ / unique violation
  | "BUSINESS_RULE_ERROR"   // business rule violation
  | "INTERNAL_ERROR";       // unexpected, ไม่ expose detail
```

### Implementation Pattern (HOF wrapper)

```typescript
// src/lib/api-handler.ts
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return apiValidationError(err);   // 400
      }
      if (err instanceof NotFoundError) {
        return apiNotFound(err.message);  // 404
      }
      // ... other known errors
      logger.error(err);
      return apiInternalError();          // 500 — no leak
    }
  };
}
```

---

## 6. 🔑 Auth & Authorization Design

### Auth Mechanism

| Item | Decision | เหตุผล |
|---|---|---|
| Provider | NextAuth.js + Credentials | ไม่ต้องการ OAuth สำหรับ admin system ภายใน |
| Session | httpOnly Cookie | ป้องกัน XSS ได้ดีกว่า localStorage |
| Password | bcrypt (cost factor 12) | Industry standard, ป้องกัน brute force |
| Token Expiry | 24 ชั่วโมง | Balance ระหว่าง security กับ UX |

### Admin Provisioning (วิธี add admin)

> **Admin ไม่สามารถสมัครเองได้** — ต้องถูก provision โดย dev เท่านั้น (security by design)

```sql
-- วิธี add admin ใน production:
UPDATE blog8byte_user
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

หรือใช้ seed script:
```bash
pnpm db:seed:admin -- --email admin@yourdomain.com
```

### Route Protection

```
Public Routes (no auth):
  GET  /api/blogs
  GET  /api/blogs/:slug
  POST /api/blogs/:slug/comments

Protected Routes (require session + role = admin):
  POST   /api/auth/login          ← เฉพาะ non-authenticated
  GET    /api/admin/blogs
  PUT    /api/admin/blogs/:id
  PATCH  /api/admin/blogs/:id/publish
  GET    /api/admin/blogs/:id/comments
  PATCH  /api/admin/comments/:id
  DELETE /api/admin/comments/:id
```

### Middleware Pattern

```typescript
// src/middleware.ts
export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/api/admin");
  const isAdminPage  = req.nextUrl.pathname.startsWith("/admin");

  if ((isAdminRoute || isAdminPage) && req.auth?.user?.role !== "admin") {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
});

export const config = {
  matcher: ["/api/admin/:path*", "/admin/:path*"],
};
```

---

## 7. 🗺️ API Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/blogs` | ❌ | List published blogs |
| `GET` | `/api/blogs/:slug` | ❌ | Blog detail + comments |
| `POST` | `/api/blogs/:slug/comments` | ❌ | Submit comment |
| `POST` | `/api/auth/login` | ❌ | Admin login |
| `GET` | `/api/admin/blogs` | ✅ | List all blogs |
| `PUT` | `/api/admin/blogs/:id` | ✅ | Edit blog |
| `PATCH` | `/api/admin/blogs/:id/publish` | ✅ | Toggle publish |
| `GET` | `/api/admin/blogs/:id/comments` | ✅ | List all comments |
| `PATCH` | `/api/admin/comments/:id` | ✅ | Approve/reject comment |
| `DELETE` | `/api/admin/comments/:id` | ✅ | Delete comment |

---

*อัปเดตล่าสุด: 2026-04-25 — ครอบคลุม Phase 2 ทั้งหมดตาม Q2 Production-Ready Checklist*
