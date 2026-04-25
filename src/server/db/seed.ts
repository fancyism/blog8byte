/**
 * @fileoverview Database seed script for Blog8byte.
 *
 * The seed is intentionally idempotent:
 * - reuses the same admin account by email
 * - repairs duplicate admin rows left by older partial seed runs
 * - upserts sample blogs by slug
 * - refreshes sample images/comments for the seeded blogs
 */

import { hashSync } from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

import { db } from "./index";
import {
  accounts,
  blogImages,
  blogs,
  comments,
  sessions,
  users,
} from "./schema";

const ADMIN_EMAIL = process.env.ADMIN_DEFAULT_EMAIL ?? "admin@blog8byte.com";
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD ?? "admin1234";

const seedBlogs = [
  {
    title: "เริ่มต้นเส้นทาง Full-Stack Developer ในปี 2026",
    slug: "fullstack-developer-roadmap-2026",
    excerpt: "เส้นทางจาก zero สู่ Full-Stack Developer ที่ใช้งานได้จริง พร้อมเครื่องมือที่ต้องรู้ในยุค AI",
    content: `# เริ่มต้นเส้นทาง Full-Stack Developer ในปี 2026

การเป็น Full-Stack Developer ไม่ได้แปลว่าต้องรู้ทุกอย่าง แต่ต้องเข้าใจภาพรวมของระบบตั้งแต่หน้าเว็บจนถึงฐานข้อมูล

## แกนหลักที่ควรรู้

- React และ Next.js สำหรับ frontend
- Node.js และ TypeScript สำหรับ backend
- PostgreSQL และ ORM สำหรับข้อมูล
- Deployment, monitoring และ CI/CD สำหรับ production

## สรุป

เริ่มจากพื้นฐานให้แน่น แล้วค่อยต่อยอดเป็นระบบจริงทีละส่วน`,
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-01T09:00:00Z"),
  },
  {
    title: "ทำความรู้จัก React Server Components",
    slug: "react-server-components-explained",
    excerpt: "RSC เปลี่ยนวิธีคิดเรื่อง data fetching และ bundle size ไปพอสมควร",
    content: `# ทำความรู้จัก React Server Components

React Server Components ช่วยให้เราย้ายงานที่ไม่ต้องใช้ interactivity ไปทำบน server ได้

## ข้อดี

- ลด JavaScript ที่ส่งไป browser
- fetch data ได้ตรงใน component
- render หน้าแรกได้เร็วขึ้น`,
    coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-05T10:00:00Z"),
  },
  {
    title: "สร้างระบบ Authentication ที่ปลอดภัยด้วย NextAuth v5",
    slug: "nextauth-v5-secure-authentication",
    excerpt: "วิธีสร้างระบบ login ที่ปลอดภัยด้วย NextAuth v5 พร้อม Credentials Provider",
    content: `# สร้างระบบ Authentication ที่ปลอดภัยด้วย NextAuth v5

ระบบ login ที่ดีควรดูแลทั้งการยืนยันตัวตน การจัดการ session และการเก็บรหัสผ่านอย่างปลอดภัย

## สิ่งที่ต้องมี

- hash password ด้วย bcrypt
- ใช้ httpOnly cookie
- จำกัดสิทธิ์ด้วย role
- แยก error ของระบบออกจาก error ของผู้ใช้`,
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-08T14:00:00Z"),
  },
  {
    title: "ออกแบบ Database Schema ที่ดีตั้งแต่แรก",
    slug: "database-schema-design-best-practices",
    excerpt: "หลักการออกแบบ schema ที่ช่วยให้ระบบ scale ได้โดยไม่ต้อง refactor ใหญ่ทีหลัง",
    content: `# ออกแบบ Database Schema ที่ดีตั้งแต่แรก

Schema ที่ดีช่วยลดทั้ง bug และค่าใช้จ่ายในการแก้ระบบภายหลัง

## หลักสำคัญ

- ตั้งชื่อให้สื่อความหมาย
- เพิ่ม index ในจุดที่ query จริง
- ออกแบบ relationship ให้ชัด
- เก็บ timestamps ให้ครบ`,
    coverImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-10T11:00:00Z"),
  },
  {
    title: "Zod: Runtime Validation ที่ TypeScript ทำแทนไม่ได้",
    slug: "zod-runtime-validation-typescript",
    excerpt: "TypeScript ช่วยตอนเขียน แต่ Zod ช่วยตอน runtime และรับข้อมูลจากภายนอก",
    content: `# Zod: Runtime Validation ที่ TypeScript ทำแทนไม่ได้

TypeScript หายไปหลัง compile แต่ข้อมูลที่มาจาก user และ API ยังต้องถูกตรวจตอน runtime

## Zod ช่วยอะไร

- validate request body
- สร้าง type จาก schema
- ส่ง error message ที่ชัดเจนกลับไปยัง caller`,
    coverImage: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-12T08:30:00Z"),
  },
  {
    title: "สร้าง CI/CD Pipeline สำหรับ Next.js Project",
    slug: "ci-cd-pipeline-nextjs",
    excerpt: "ตั้งแต่ lint จนถึง deploy อัตโนมัติด้วย quality gates ที่ชัดเจน",
    content: `# สร้าง CI/CD Pipeline สำหรับ Next.js Project

ทุกโปรเจกต์ที่จริงจังควรมี pipeline ที่ตรวจซ้ำแบบอัตโนมัติ

## Quality gates

1. lint
2. typecheck
3. test
4. build
5. deploy`,
    coverImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-15T16:00:00Z"),
  },
  {
    title: "เทคนิคเพิ่ม Performance ให้ Next.js App",
    slug: "nextjs-performance-optimization",
    excerpt: "รวมเทคนิคที่ช่วยให้เว็บโหลดเร็วขึ้นและตอบสนองได้ดีขึ้น",
    content: `# เทคนิคเพิ่ม Performance ให้ Next.js App

Performance ที่ดีคือส่วนหนึ่งของ UX ที่ดี

## แนวทางพื้นฐาน

- ใช้ Server Components ให้มากที่สุด
- lazy load ส่วนที่ไม่จำเป็น
- optimize รูปภาพ
- วาง Suspense boundary ให้เหมาะสม`,
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    status: "draft" as const,
    publishedAt: null,
  },
  {
    title: "การจัดการ State ใน React 2026",
    slug: "react-state-management-2026",
    excerpt: "ต้องใช้ Redux เสมอไหม หรือ React สมัยใหม่มีทางเลือกที่เรียบง่ายกว่า",
    content: `# การจัดการ State ใน React 2026

ไม่ใช่ทุกปัญหาที่ต้องเริ่มจาก global state library

## ตัวเลือกที่ควรพิจารณา

1. local state
2. server state
3. URL state
4. lightweight store เฉพาะจุด`,
    coverImage: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-18T09:00:00Z"),
  },
  {
    title: "Drizzle ORM คืออะไร เหมาะกับโปรเจกต์ไหน",
    slug: "drizzle-orm-overview",
    excerpt: "เปรียบเทียบ Drizzle กับ Prisma และ TypeORM ว่าตัวไหนเหมาะกับงานแบบไหน",
    content: `# Drizzle ORM คืออะไร เหมาะกับโปรเจกต์ไหน

Drizzle เป็น ORM ที่เน้น type safety และ performance โดยไม่ต้องใช้ codegen

## จุดเด่น

- SQL-like syntax ที่ type-safe
- ไม่ต้อง generate client
- Bundle size เล็ก
- รองรัน PostgreSQL, MySQL, SQLite

## เปรียบเทียบ

- Prisma: สะดวกกว่าแต่ heavy กว่า
- TypeORM: decorator-heavy อาจซับซ้อน
- Drizzle: ความสมดุลระหว่าง type safety และความคุ้นเคยกับ SQL`,
    coverImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-20T10:00:00Z"),
  },
  {
    title: "Tailwind CSS v4 อะไรใหม่ที่น่าสนใจ",
    slug: "tailwind-css-v4-whats-new",
    excerpt: "ภาพรวมฟีเจอร์ใหม่ของ Tailwind CSS v4 ที่เปลี่ยนวิธีเขียน utility-first CSS",
    content: `# Tailwind CSS v4 อะไรใหม่ที่น่าสนใจ

Tailwind v4 มาพร้อม engine ใหม่ที่เร็วขึ้นและฟีเจอร์ที่ตอบโจทย์การใช้งานจริงมากขึ้น

## สิ่งที่เปลี่ยนแปลง

- CSS-first configuration (ลด config ใน JS)
- Performance ดีขึ้นอย่างมาก
- รองรับ native CSS nesting
- ใช้ Lightning CSS เป็น engine หลัก

## สรุป

ถ้าใช้ Tailwind อยู่แล้ว การอัปเกรดมีแต่ได้กับได้`,
    coverImage: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-22T08:00:00Z"),
  },
  {
    title: "shadcn/ui ทำไมถึงไม่ใช่ Component Library",
    slug: "shadcn-ui-not-a-component-library",
    excerpt: "เข้าใจหลักการของ shadcn/ui ที่ copy code เข้าโปรเจกต์แทนการติดตั้ง package",
    content: `# shadcn/ui ทำไมถึงไม่ใช่ Component Library

shadcn/ui ไม่ได้เป็น npm package แต่เป็นชุดโค้ดที่คุณเป็นเจ้าของและแก้ไขได้เต็มที่

## หลักการ

- โค้ดอยู่ในโปรเจกต์ของคุณ ไม่ใช่ dependency
- สร้างบน Radix UI primitives
- ใช้ Tailwind CSS ในการกำหนดสไตล์
- custom ได้ทุกอย่างโดยไม่ต้อง override

## ข้อดี

- ไม่มี version conflict
- bundle เฉพาะที่ใช้
- เปลี่ยนแปลงได้ตามต้องการ`,
    coverImage: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-24T11:30:00Z"),
  },
  {
    title: "Cloudflare R2 สำหรับเก็บไฟล์แทน S3 คุ้มไหม",
    slug: "cloudflare-r2-vs-aws-s3",
    excerpt: "เปรียบเทียบ R2 กับ S3 ทั้งราคา performance และการใช้งานจริง",
    content: `# Cloudflare R2 สำหรับเก็บไฟล์แทน S3 คุ้มไหม

R2 เป็น object storage ที่เข้ากันได้กับ S3 API แต่ไม่มีค่า egress fee

## จุดเด่นของ R2

- ไม่มีค่า egress (ออกข้อมูลฟรี)
- S3-compatible API เปลี่ยนมาใช้ได้ง่าย
- ผูกกับ Cloudflare ecosystem

## เมื่อไหร่ควรใช้

- แอปที่มีการอ่านไฟล์บ่อย
- ต้องการลดค่าใช้จ่าย bandwidth
- ใช้ Cloudflare CDN อยู่แล้ว`,
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-26T14:00:00Z"),
  },
  {
    title: "TypeScript Strict Mode ทำไมต้องเปิดใช้",
    slug: "typescript-strict-mode-why",
    excerpt: "ค่าเริ่มต้นของ TypeScript ยังมีช่องโหว่ที่ strict mode ช่วยปิดได้",
    content: `# TypeScript Strict Mode ทำไมต้องเปิดใช้

TypeScript ที่ไม่เปิด strict เหมือนมี airbag แต่ไม่ได้เสียบ

## strict ช่วยอะไร

- \`strictNullChecks\`: ป้องกัน null/undefined แบบไม่คาดฝัน
- \`noImplicitAny\`: บังคับให้กำหนด type ทุกที่
- \`strictFunctionTypes\`: ตรวจ function signature ให้แม่นยำขึ้น

## สรุป

เปิดตั้งแต่วันแรกของโปรเจกต์ ปิดทีหลังเจ็บตัวกว่า`,
    coverImage: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-04-28T09:00:00Z"),
  },
  {
    title: "Docker Compose สำหรับ Developer มือใหม่",
    slug: "docker-compose-for-beginners",
    excerpt: "ใช้ Docker Compose สร้าง environment ที่สมบูรณ์สำหรับ local development",
    content: `# Docker Compose สำหรับ Developer มือใหม่

ไม่ต้องติดตั้ง database บนเครื่องอีกต่อไป ใช้ Docker Compose สร้าง environment ที่เหมือน production

## พื้นฐาน

- สร้างไฟล์ \`docker-compose.yml\` ที่ root ของโปรเจกต์
- กำหนด service ที่ต้องใช้ (database, cache, ฯลฯ)
- สั่ง \`docker compose up -d\` แล้วใช้งานได้เลย

## เทคนิค

- ใช้ healthcheck ให้ service รอพร้อมก่อน
- ใช้ volumes เก็บข้อมูลถาวร
- ตั้งชื่อ container ให้จำง่าย`,
    coverImage: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-05-01T10:00:00Z"),
  },
  {
    title: "Husky และ lint-staged ป้องกันโค้ดแยกเข้า repository",
    slug: "husky-lint-staged-git-hooks",
    excerpt: "ตั้งค่า pre-commit hooks ให้ lint และ format อัตโนมัติก่อนทุก commit",
    content: `# Husky และ lint-staged ป้องกันโค้ดแยกเข้า repository

ทำไมบางทีมโค้ดถึงสวยสม่ำเสมอ เพราะมีระบบคุม quality ก่อนเข้า git

## การทำงาน

1. Husky จับ Git hooks (pre-commit, pre-push)
2. lint-staged รันเฉพาะไฟล์ที่ staged
3. ESLint ตรวจ syntax และ best practice
4. Prettier จัด format ให้เรียบร้อย

## ข้อดี

- ไม่มีโค้ดที่ไม่ผ่าน lint เข้า main
- ไม่ต้องวิ่งตามแก้ format ใน code review
- CI ไม่ต้องเสียเวลา format check`,
    coverImage: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-05-03T13:00:00Z"),
  },
  {
    title: "คู่มือเขียน API Route ใน Next.js App Router",
    slug: "nextjs-app-router-api-routes-guide",
    excerpt: "สร้าง RESTful API ด้วย Route Handlers ของ Next.js 15 อย่างถูกวิธี",
    content: `# คู่มือเขียน API Route ใน Next.js App Router

Route Handlers ใน App Router แทนที่ Pages Router API routes ด้วยรูปแบบที่ยืดหยุ่นกว่า

## โครงสร้าง

- วาง \`route.ts\` ใน \`app/api/...\`
- export function ตาม HTTP method: GET, POST, PUT, DELETE
- return \`NextResponse.json()\` สำหรับ response

## Best Practice

- ใช้ Zod validate request body
- ห่อด้วย error handler กลาง
- ตรวจสอบ auth ก่อนดำเนินการ
- ส่ง response code ให้ถูกต้อง`,
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    status: "published" as const,
    publishedAt: new Date("2026-05-05T15:00:00Z"),
  },
];

const commentTemplates = [
  {
    key: "roadmap-1",
    slug: "fullstack-developer-roadmap-2026",
    authorName: "สมชาย",
    content: "บทความดีมากครับ อ่านเข้าใจง่าย เหมาะสำหรับมือใหม่",
    status: "approved" as const,
  },
  {
    key: "roadmap-2",
    slug: "fullstack-developer-roadmap-2026",
    authorName: "สมศรี",
    content: "ขอบคุณสำหรับข้อมูลค่ะ เป็นประโยชน์มาก",
    status: "approved" as const,
  },
  {
    key: "roadmap-3",
    slug: "fullstack-developer-roadmap-2026",
    authorName: "วิชัย",
    content: "อยากให้เขียนเรื่องตัวอย่างโปรเจกต์จริงบ้างครับ",
    status: "approved" as const,
  },
  {
    key: "roadmap-4",
    slug: "fullstack-developer-roadmap-2026",
    authorName: "ชาวเน็ต",
    content: "ลองทำตามแล้วได้ผลจริงครับ",
    status: "pending" as const,
  },
  {
    key: "rsc-1",
    slug: "react-server-components-explained",
    authorName: "นักพัฒนา",
    content: "อธิบายเรื่องเซิร์ฟเวอร์คอมโพเนนต์ได้ชัดเจนมาก",
    status: "approved" as const,
  },
  {
    key: "rsc-2",
    slug: "react-server-components-explained",
    authorName: "มือใหม่",
    content: "ยังงงนิดหน่อยตรงส่วนไฮเดรชันครับ",
    status: "approved" as const,
  },
  {
    key: "rsc-3",
    slug: "react-server-components-explained",
    authorName: "สแปม",
    content: "ทดสอบระบบคอมเมนต์",
    status: "rejected" as const,
  },
  {
    key: "auth-1",
    slug: "nextauth-v5-secure-authentication",
    authorName: "แอดมินจูเนียร์",
    content: "ใช้วิธีนี้กับโปรเจกต์ที่ทำอยู่ ใช้ได้ดีมากครับ",
    status: "approved" as const,
  },
  {
    key: "auth-2",
    slug: "nextauth-v5-secure-authentication",
    authorName: "นักศึกษา",
    content: "กำลังทำโปรเจกต์จบพอดี ขอบคุณมากค่ะ",
    status: "pending" as const,
  },
  {
    key: "schema-1",
    slug: "database-schema-design-best-practices",
    authorName: "ดีบีเอ",
    content: "เรื่องอินเด็กซ์สำคัญมากครับ หลายคนมองข้าม",
    status: "approved" as const,
  },
  {
    key: "schema-2",
    slug: "database-schema-design-best-practices",
    authorName: "จูเนียร์เดฟ",
    content: "ขอบคุณครับ เพิ่งรู้เรื่องคอมพาวด์อินเด็กซ์",
    status: "approved" as const,
  },
  {
    key: "zod-1",
    slug: "zod-runtime-validation-typescript",
    authorName: "แบ็กเอนด์เดฟ",
    content: "Zod ช่วยได้เยอะมาก โดยเฉพาะตอนทำ API",
    status: "approved" as const,
  },
  {
    key: "zod-2",
    slug: "zod-runtime-validation-typescript",
    authorName: "ฟรอนท์เอนด์",
    content: "ใช้ Zod ร่วมกับ React Hook Form ได้ดีมากครับ",
    status: "approved" as const,
  },
  {
    key: "zod-3",
    slug: "zod-runtime-validation-typescript",
    authorName: "ผู้อ่าน",
    content: "รอบทความต่อไปเรื่องวาลิเดชันครับ",
    status: "pending" as const,
  },
  {
    key: "cicd-1",
    slug: "ci-cd-pipeline-nextjs",
    authorName: "เดฟออปส์",
    content: "CI/CD สำคัญมาก ทุกโปรเจกต์ควรมี",
    status: "approved" as const,
  },
  {
    key: "state-1",
    slug: "react-state-management-2026",
    authorName: "รีแอคเตอร์",
    content: "เห็นด้วยว่าไม่ต้องใช้ Redux ตลอด บางที useState ก็พอ",
    status: "approved" as const,
  },
  {
    key: "drizzle-1",
    slug: "drizzle-orm-overview",
    authorName: "เดฟฐานข้อมูล",
    content: "ใช้ Drizzle มาสักพักแล้ว ชอบที่ query ดูเหมือน SQL มาก",
    status: "approved" as const,
  },
  {
    key: "drizzle-2",
    slug: "drizzle-orm-overview",
    authorName: "เปรียบเทียบ",
    content: "เพิ่งย้ายมาจาก Prisma ประทับใจมากครับ",
    status: "approved" as const,
  },
  {
    key: "tw4-1",
    slug: "tailwind-css-v4-whats-new",
    authorName: "UI เดฟ",
    content: "เร็วขึ้นจริง รู้สึกได้ตอน dev",
    status: "approved" as const,
  },
  {
    key: "shadcn-1",
    slug: "shadcn-ui-not-a-component-library",
    authorName: "คนทำหน้า",
    content: "ชอบแนวคิดที่เราเป็นเจ้าของโค้ดเอง แก้ไข้อะไรก็ได้",
    status: "approved" as const,
  },
  {
    key: "shadcn-2",
    slug: "shadcn-ui-not-a-component-library",
    authorName: "มือใหม่ CSS",
    content: "เริ่มจาก shadcn แล้วค่อยแก้ ง่ายกว่าเขียนเองตั้งแต่แรก",
    status: "approved" as const,
  },
  {
    key: "r2-1",
    slug: "cloudflare-r2-vs-aws-s3",
    authorName: "คลาวด์เอนจิเนียร์",
    content: "ไม่มี egress fee ช่วยประหยัดได้เยอะสำหรับแอปที่มีรูปเยอะ",
    status: "approved" as const,
  },
  {
    key: "ts-1",
    slug: "typescript-strict-mode-why",
    authorName: "TS สายกลาง",
    content: "เคยปิด strict แล้วเจอ bug จาก null ตลอด ตอนนี้เปิดทุกโปรเจกต์",
    status: "approved" as const,
  },
  {
    key: "docker-1",
    slug: "docker-compose-for-beginners",
    authorName: "มือใหม่ Docker",
    content: "อธิบายเข้าใจง่ายมากครับ ทำตามได้เลย",
    status: "approved" as const,
  },
  {
    key: "docker-2",
    slug: "docker-compose-for-beginners",
    authorName: "เดวเวลอปเปอร์",
    content: "เรื่อง healthcheck สำคัญมาก ช่วยให้ไม่ต้องรัน script รอเอง",
    status: "pending" as const,
  },
  {
    key: "husky-1",
    slug: "husky-lint-staged-git-hooks",
    authorName: "ทีมลีด",
    content: "ตั้ง Husky ทีมแล้ว code review สบายขึ้นเยอะ",
    status: "approved" as const,
  },
  {
    key: "api-1",
    slug: "nextjs-app-router-api-routes-guide",
    authorName: "แบ็กเอนด์",
    content: "เปรียบเทียบกับ Pages Router แล้ว App Router ยืดหยุ่นกว่าจริง",
    status: "approved" as const,
  },
  {
    key: "api-2",
    slug: "nextjs-app-router-api-routes-guide",
    authorName: "ฟูลแสตก",
    content: "ใช้ Zod กับ API route แล้วรู้สึกปลอดภัยขึ้นเยอะ",
    status: "approved" as const,
  },
];

const replyTemplates = [
  {
    slug: "fullstack-developer-roadmap-2026",
    parentKey: "roadmap-1",
    authorName: "ผู้เขียน",
    content: "ขอบคุณที่อ่านครับ จะพยายามเขียนให้เข้าใจง่ายต่อไป",
    status: "approved" as const,
  },
  {
    slug: "fullstack-developer-roadmap-2026",
    parentKey: "roadmap-3",
    authorName: "ผู้เขียน",
    content: "รับทราบครับ จะเขียนบทความตัวอย่างโปรเจกต์จริงเร็ว ๆ นี้",
    status: "approved" as const,
  },
];

async function syncAdminUser() {
  const passwordHash = hashSync(ADMIN_PASSWORD, 12);
  const existingAdmins = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL));

  if (existingAdmins.length === 0) {
    const [admin] = await db
      .insert(users)
      .values({
        name: "Blog8byte Admin",
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
      })
      .returning();

    if (!admin) {
      throw new Error("Failed to create admin user");
    }

    console.log(`✅ Admin created: ${admin.email}`);
    return admin;
  }

  const [primaryAdmin, ...duplicateAdmins] = existingAdmins;
  if (!primaryAdmin) {
    throw new Error("Failed to resolve admin user");
  }

  if (duplicateAdmins.length > 0) {
    const duplicateIds = duplicateAdmins.map((admin) => admin.id);

    await db
      .update(blogs)
      .set({ createdById: primaryAdmin.id })
      .where(inArray(blogs.createdById, duplicateIds));
    await db
      .update(accounts)
      .set({ userId: primaryAdmin.id })
      .where(inArray(accounts.userId, duplicateIds));
    await db
      .update(sessions)
      .set({ userId: primaryAdmin.id })
      .where(inArray(sessions.userId, duplicateIds));
    await db.delete(users).where(inArray(users.id, duplicateIds));

    console.log(`♻️ Removed ${duplicateAdmins.length} duplicate admin record(s)`);
  }

  const [admin] = await db
    .update(users)
    .set({
      name: "Blog8byte Admin",
      passwordHash,
      role: "admin",
    })
    .where(eq(users.id, primaryAdmin.id))
    .returning();

  if (!admin) {
    throw new Error("Failed to sync admin user");
  }

  console.log(`♻️ Admin synced: ${admin.email}`);
  return admin;
}

async function syncBlogs(adminId: string) {
  return Promise.all(
    seedBlogs.map(async (blog) => {
      const [syncedBlog] = await db
        .insert(blogs)
        .values({
          ...blog,
          createdById: adminId,
        })
        .onConflictDoUpdate({
          target: blogs.slug,
          set: {
            title: blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
            coverImage: blog.coverImage,
            status: blog.status,
            publishedAt: blog.publishedAt,
            createdById: adminId,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!syncedBlog) {
        throw new Error(`Failed to sync blog: ${blog.slug}`);
      }

      return syncedBlog;
    }),
  );
}

async function seed() {
  console.log("🌱 Seeding Blog8byte database...");

  const admin = await syncAdminUser();
  const syncedBlogs = await syncBlogs(admin.id);
  console.log(`✅ ${syncedBlogs.length} blogs synced`);

  const blogBySlug = new Map(syncedBlogs.map((blog) => [blog.slug, blog]));
  const seededBlogIds = syncedBlogs.map((blog) => blog.id);

  if (seededBlogIds.length > 0) {
    await db.delete(blogImages).where(inArray(blogImages.blogId, seededBlogIds));
  }

  const imageData = syncedBlogs.flatMap((blog) => {
    if (blog.status === "draft") {
      return [];
    }

    return [
      {
        blogId: blog.id,
        url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
        alt: "รูปประกอบบทความ 1",
        displayOrder: 1,
      },
      {
        blogId: blog.id,
        url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600",
        alt: "รูปประกอบบทความ 2",
        displayOrder: 2,
      },
    ];
  });

  if (imageData.length > 0) {
    await db.insert(blogImages).values(imageData);
  }
  console.log(`✅ ${imageData.length} blog images synced`);

  if (seededBlogIds.length > 0) {
    await db.delete(comments).where(inArray(comments.blogId, seededBlogIds));
  }

  const insertedCommentIds = new Map<string, number>();
  for (const template of commentTemplates) {
    const blog = blogBySlug.get(template.slug);
    if (!blog) {
      throw new Error(`Missing seeded blog for comment template: ${template.slug}`);
    }

    const [insertedComment] = await db
      .insert(comments)
      .values({
        blogId: blog.id,
        authorName: template.authorName,
        content: template.content,
        status: template.status,
      })
      .returning();

    if (!insertedComment) {
      throw new Error(`Failed to create comment: ${template.key}`);
    }

    insertedCommentIds.set(template.key, insertedComment.id);
  }
  console.log(`✅ ${commentTemplates.length} comments synced`);

  for (const template of replyTemplates) {
    const blog = blogBySlug.get(template.slug);
    const parentId = insertedCommentIds.get(template.parentKey);

    if (!blog || !parentId) {
      throw new Error(`Missing parent comment for reply: ${template.parentKey}`);
    }

    await db.insert(comments).values({
      blogId: blog.id,
      parentId,
      authorName: template.authorName,
      content: template.content,
      status: template.status,
    });
  }
  console.log(`✅ ${replyTemplates.length} reply comments synced`);

  console.log("\n🎉 Seed complete!");
  console.log(`   Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
