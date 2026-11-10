# STAGE 10.4 — PHASE 1: CMS ADMIN ARCHITECTURE & DESIGN SPECIFICATION

**Document ID:** `STAGE-10.4.1-CMS-ADMIN-DESIGN`  
**Date:** 2026-11-07  
**Project:** Personal Portfolio CMS — Agun Firmansyah  
**Target Environment:** Next.js 16.4.5 (App Router, Turbopack, Cache Components, PPR), PostgreSQL 14.5 (`porto_cms`), Prisma ORM 7.10.1  
**Author:** Hermes Agent (Senior Systems Architect & Security Pairing Partner)  
**Status:** PROPOSED FOR USER REVIEW (READ-ONLY PHASE)

---

## 1. Executive Summary

Tahap 10.4 bertujuan mentransformasikan sistem manajemen portfolio dari konfigurasi statis/read-only menjadi **Content Management System (CMS) Administrator yang terintegrasi penuh secara fungsional**. CMS ini memungkinkan pemilik portfolio mengelola seluruh entitas konten (identitas hero, narasi profil, proyek studi kasus, riwayat karier, taksonomi keahlian, dan saluran kontak) melalui antarmuka web yang terisolasi, aman, dan konsisten dengan estetika desain editorial Swiss Style.

### Prinsip Utama Perancangan:
1. **Separated Task-Dedicated Pages (1 Page = 1 Section/Task):** Menghindari anti-pattern "monolithic dashboard" yang menggabungkan seluruh formulir dalam satu layar. Setiap domain konten dikelola pada halaman khususnya sendiri dengan tata letak modular, terstruktur, dan fokus.
2. **Strict Clean Architecture & Separation of Concerns:** Lapisan Domain dan Application tetap steril dari dependensi Prisma, Next.js, dan database. Mutasi data hanya berjalan melalui Server Actions yang memanggil Application Use Cases, yang berinteraksi dengan Domain Repository Interfaces.
3. **Defense in Depth (Three-Tier Security):** Keamanan tidak mengandalkan satu titik periksa:
   - *Layer 1 (Optimistic Routing):* Next.js 16 Root Proxy (`proxy.ts`) untuk redirect cepat tanpa latency database.
   - *Layer 2 (Mutation Gate):* Otorisasi `verifySession()` wajib di setiap Server Action sebelum memproses input.
   - *Layer 3 (Authoritative DAL):* `verifySession()` berbasis Data Access Layer di Server Components yang memvalidasi `sessionVersion` terhadap PostgreSQL.
4. **Zero Disruption to Public Portfolio:** Portfolio publik tetap terisolasi dan dapat berjalan baik dengan `StaticPortfolioRepository` maupun `PrismaPortfolioRepository` tanpa kebocoran data draft/unauthenticated.
5. **Swiss International Typographic Style:** Konsistensi visual menggunakan palet warna editorial `#F7F6F2`, `#171717`, `#777777`, `#2449D8`, dan border 1px `#DCDAD4`, tanpa dekorasi artifisial, gradien neon, atau komponen floating yang tidak relevan.

---

## 2. Audit Kondisi Aktual Sistem

Audit teknis mendalam terhadap kode sumber dan database yang sedang berjalan menghasilkan temuan berikut:

### 2.1 Struktur Folder App Router
```
app/
├── admin/
│   ├── login/
│   │   ├── actions.ts          # Server Actions: loginAction & logoutAction
│   │   └── page.tsx            # Client Component: Swiss Login Form (useActionState)
│   └── page.tsx                # Server Component: Admin Portal Harness (<Suspense> + verifySession)
├── favicon.ico
├── globals.css                 # CSS Variables: Swiss typography & color tokens
├── layout.tsx                  # Root Layout (Geist & Geist Mono fonts)
└── page.tsx                    # Public Portfolio Page (reads via CompositionRoot)
```

### 2.2 Lapisan Autentikasi & Otorisasi
- **DAL `verifySession()` (`src/infrastructure/auth/dal.ts`):** Menggunakan `cache()` React, membaca `app_admin_session` iron-session cookie, memeriksa payload dan masa berlaku, serta mencocokkan `sessionVersion` langsung ke tabel `admins` di PostgreSQL. Throws `UnauthorizedException`, `SessionExpiredException`, atau `SessionRevokedException`.
- **Proxy (`proxy.ts`):** Next.js 16 proxy menangani pattern `/admin/:path*`. Melakukan unsealing optimistik cookie. Jika valid pada `/admin/login`, redirect ke `/admin`. Jika tidak valid pada `/admin/*`, redirect ke `/admin/login`. *Bukan otoritas tunggal.*
- **Session Helper (`src/infrastructure/auth/session.ts`):** Menggunakan `iron-session` 9.0.1, TTL 7 hari, cookie `httpOnly: true`, `sameSite: "lax"`, dan enkripsi AES-GCM 256-bit via secret `SESSION_SECRET`.

### 2.3 Dependency Injection & Repositories (`CompositionRoot`)
- `CompositionRoot` saat ini mengelola:
  - `getPortfolioRepository('static' | 'prisma')`: Mendukung dual-source untuk query public portfolio.
  - `getPortfolioUseCase('static' | 'prisma')`: Use case `GetPortfolioUseCase` untuk mengambil aggregate `Portfolio`.
  - `getAdminRepository()`: `PrismaAdminRepository` untuk operasi autentikasi dan revocation admin.
  - `getPasswordService()`, `getRateLimiter()`, `getLoginAdminUseCase()`, `getLogoutAdminUseCase()`, `getBootstrapAdminUseCase()`.
- **Keterbatasan Saat Ini:** Belum ada repositori atau use case untuk operasi mutasi CUD (Create, Update, Delete) entitas konten individu di lapisan Domain atau Infrastructure.

### 2.4 Model Prisma & Kondisi Database Aktual
Database aktif: PostgreSQL 14.5 (`porto_cms`) via Laragon. 8 database eksternal lainnya (`Owner`, `db_unm`, `fashiondb`, `padekinapp`, `pesantren`, `powerteam`, `powerteamm`, `tkunh_user_service`) terbukti 100% steril.

Kondisi 13 tabel aplikasi saat ini:
1. `hero_profiles`: 1 row (Singleton `id = 'singleton'`)
2. `roles`: 4 rows (Koleksi)
3. `engineering_nodes`: 3 rows (Koleksi)
4. `about_profiles`: 1 row (Singleton `id = 'singleton'`)
5. `domains`: 4 rows (Koleksi)
6. `pillars`: 3 rows (Koleksi)
7. `projects`: 3 rows (Koleksi)
8. `experiences`: 5 rows (Koleksi)
9. `skill_categories`: 4 rows (Koleksi)
10. `skills`: 11 rows (Koleksi, FK ke `skill_categories`)
11. `contact_profiles`: 1 row (Singleton `id = 'singleton'`)
12. `contact_channels`: **0 rows** (Koleksi, withheld per Stage 10.2.1)
13. `admins`: **0 rows** (Single-Admin, bootstrap belum dieksekusi)
**Total: Tepat 40 records seed baseline.**

---

## 3. Rancangan CMS Admin Shell

Admin Shell merupakan kerangka tata letak terpadu yang membungkus seluruh sub-halaman CMS di bawah rute `/admin/*`. Shell ini mengimplementasikan prinsip desain Swiss International Typographic Style: garis 1px berkarakter tegas, tipografi proporsional, hierarki informasi monospaced untuk metadata, serta navigasi yang fungsional dan cepat.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: [=] Logo/Status • porto_cms (Active) • Breadcrumb • [View Site ↗] • User • Logout │
├──────────────────────┬─────────────────────────────────────────────────────────────────┤
│ SIDEBAR NAVIGATION   │ MAIN CONTENT AREA                                               │
│                      │                                                                 │
│ ▾ DASHBOARD          │ ┌─────────────────────────────────────────────────────────────┐ │
│   Overview           │ │ Module Header: Title, Description, Context Action           │ │
│                      │ └─────────────────────────────────────────────────────────────┘ │
│ ▾ PORTFOLIO CONTENT  │                                                                 │
│   Hero Profile       │ [ Dedicated Section / Task Work Area ]                          │
│   Roles              │                                                                 │
│   Engineering Nodes  │ • Clean tabular view / modular form layout                      │
│   About Profile      │ • Inline feedback, pristine input boundaries                   │
│   Domains            │ • 1px border-[#DCDAD4] separation                               │
│   Pillars            │ • Monospace status indicators                                   │
│   Projects           │                                                                 │
│   Experiences        │                                                                 │
│   Skills & Taxonomy  │                                                                 │
│   Contact Profile    │                                                                 │
│   Contact Channels   │                                                                 │
│                      │                                                                 │
│ ▾ SYSTEM             │                                                                 │
│   Account Settings   │                                                                 │
│                      │                                                                 │
├──────────────────────┴─────────────────────────────────────────────────────────────────┤
│ FOOTER STRIP: Porto CMS v1.0 • Clean Architecture • Stage 10.4                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Komponen Inti Shell

1. **Admin Layout (`app/admin/layout.tsx`):**
   - Menggunakan Server Component yang memanggil `await verifySession()` sebelum me-render subtree admin.
   - Mengatur grid responsif: sidebar di kiri (desktop lebar 260px, fixed/sticky) dan main content di kanan.
2. **Sidebar Navigation (`AdminSidebar`):**
   - Berisi tautan terstruktur per kategori logis.
   - Active state ditandai dengan border-left 3px warna cobalt blue (`#2449D8`), teks tebal `#171717`, dan background subtil `#ECEAE4`.
   - Inactive state: teks muted `#777777` dengan transisi hover ke `#171717`.
   - Menggunakan `next/link` untuk prefetching dan navigasi SPA instan.
3. **Header / Topbar (`AdminTopbar`):**
   - **Breadcrumb Navigasi:** Menampilkan hirarki halaman aktif (misal: `CMS / Projects / Edit Project`).
   - **Database Status Indicator:** Badge monospaced kecil `● porto_cms` (hijau) memberikan kepastian lingkungan aktif.
   - **Public Preview Link:** Tautan eksternal `View Public Site ↗` menuju `/` (membuka tab baru).
   - **Admin Identity Badge:** Menampilkan nama pengguna yang sedang login (`session.username`).
   - **Logout Action:** Tombol sign out berbasis form Server Action (`logoutAction`) yang mengeksekusi atomic revocation.
4. **Main Content Area:**
   - Container terpusat dengan padding responsif (`px-6 py-8` hingga `px-12 py-10`).
   - Header modul standar: Judul utama (`text-2xl font-bold tracking-tight`), sub-deskripsi fungsional, dan tombol aksi primer (misal: `+ New Item` atau `Save Changes`).
5. **Responsive Mobile Navigation:**
   - Tombol toggle hamburger pada viewport `< 1024px` (LG breakpoint).
   - Slide-over backdrop drawer yang dapat ditutup via tombol silang (Esc) atau klik di luar area menu.
6. **Standardized Swiss UI States:**
   - **Loading State (`loading.tsx` / `<Suspense>` Fallback):** Skeleton frame berpola wireframe abu-abu netral dengan border halus, tanpa animasi berlebihan, bertuliskan monospace `[LOADING DATA...]`.
   - **Empty State:** Panel berbingkai 1px `#DCDAD4` dengan latar putih, indikator monospace `[NO_RECORDS_FOUND]`, penjelasan konteks, dan tombol CTA primer untuk membuat data baru.
   - **Error State (`error.tsx`):** Panel error monospaced dengan border `#FCA5A5` dan latar `#FEF2F2`, menampilkan kode kesalahan teknis, dan tombol `Try Again`.

---

## 4. Evaluasi & Rancangan Navigasi CMS

Sesuai preferensi mutlak pengguna (*"User prefers admin/CMS dashboard designs to be separated into dedicated per-section pages (1 page = 1 section/task) rather than combining all section managers into a single screen"*), seluruh modul dipecah menjadi halaman mandiri.

Tabel evaluasi navigasi dan keputusannya:

| Menu & Rute | Model Prisma Terkait | Tipe Data | Evaluasi & Alasan Pemisahan |
|---|---|---|---|
| **Dashboard** (`/admin`) | Seluruh Model | Agregat Ringkasan | Hub pusat navigasi; menyajikan metrik jumlah data, status database, waktu pembaruan terakhir, dan tautan pintas. |
| **Hero Profile** (`/admin/hero`) | `HeroProfile` | Singleton | Mengelola identitas nama, tagline, bio editorial, lokasi (ID/GMT+7), dan disiplin ilmu. |
| **Roles** (`/admin/roles`) | `Role` | Koleksi | Mengelola daftar peran profesional (Software Developer, Backend Engineer, dll.), urutan tampilan, dan penanda peran primer (`primary: boolean`). |
| **Engineering Nodes** (`/admin/engineering-nodes`) | `EngineeringNode` | Koleksi | Mengelola 3 pilar aksi engineering (Deconstruct, Architect & Build, Share & Educate), tag, stack, dan sorotan (`highlighted`). |
| **About Profile** (`/admin/about`) | `AboutProfile` | Singleton | Mengelola narasi biografi mendalam, heading, quote filosofi, serta narasi primer dan sekunder. |
| **Domains** (`/admin/domains`) | `Domain` | Koleksi | Mengelola domain keahlian terstruktur (Software Engineering, Backend Development, dll.) dengan kode indeks numerik. |
| **Pillars** (`/admin/pillars`) | `Pillar` | Koleksi | Mengelola pilar arsitektur fundamental (Backend Systems, Practical Solutions, dll.) dan deskripsi teknisnya. |
| **Projects** (`/admin/projects`) | `Project` | Koleksi | Mengelola portofolio proyek studi kasus, deskripsi, tag teknologi (JSON array), URL repositori/demo, status publikasi, dan urutan. |
| **Experiences** (`/admin/experiences`) | `Experience` | Koleksi | Mengelola linimasa karier profesional, institusi/perusahaan, track, rentang tanggal (start/end date), dan deskripsi pencapaian. |
| **Skills & Taxonomy** (`/admin/skills`) | `SkillCategory`, `Skill` | Hierarki Relasional | Mengelola 4 kategori keahlian dan 11 skill teknis yang berelasi langsung dengan integritas relasi foreign key. |
| **Contact Profile** (`/admin/contact`) | `ContactProfile` | Singleton | Mengelola copy ajakan bertindak (heading, ctaLabel, deskripsi ajakan kolaborasi). |
| **Contact Channels** (`/admin/contact-channels`) | `ContactChannel` | Koleksi (0 rows) | Mengelola saluran komunikasi langsung (Email resmi, GitHub, LinkedIn). Modul ini siap untuk provisi perdana. |
| **Account Settings** (`/admin/account`) | `Admin` | Single-Admin | Manajemen akun tunggal administrator: ganti username, ganti password kuat, dan rotasi session version. |

---

## 5. Rancangan Spesifikasi Content Management Per Modul

Setiap modul didesain secara ketat berdasarkan skema Prisma yang sudah ada (tanpa menambah kolom atau tabel baru):

### 5.1 Modul Hero Profile (`/admin/hero`)
- **Tujuan:** Mengelola teks identitas pembuka pada landing page.
- **Data yang Dikelola:** `name`, `tagline`, `bio`, `country`, `code`, `timezone`, `discipline`.
- **Karakteristik:** Singleton mutlak (`id = 'singleton'`).
- **Operasi:** READ (ambil record singleton) dan UPDATE (simpan perubahan form). Tidak ada CREATE atau DELETE.
- **Validasi:** `name` min 2 karakter, `tagline` non-empty, `code` format negara (misal 'ID'), `timezone` valid.
- **Risiko:** Perubahan langsung berdampak pada identitas publik pertama yang dibaca pengunjung.

### 5.2 Modul Roles (`/admin/roles`)
- **Tujuan:** Mengatur variasi titel profesi yang dirotasikan atau disorot pada header.
- **Data yang Dikelola:** `title`, `primary` (boolean), `order` (int).
- **Karakteristik:** Koleksi jamak (multiple records).
- **Operasi:** CRUD + Reorder (`swapOrder` atau `updateOrder`).
- **Validasi:** `title` unik/tidak kosong, aturan bisnis: tepat 1 record bertindak sebagai `primary: true` (jika record baru diset `primary`, record lain otomatis diset `false` dalam satu transaksi).

### 5.3 Modul Engineering Nodes (`/admin/engineering-nodes`)
- **Tujuan:** Mengelola blok fokus pendekatan teknis pada Hero section.
- **Data yang Dikelola:** `tag`, `title`, `description`, `stack` (opsional), `highlighted` (boolean), `order` (int).
- **Karakteristik:** Koleksi jamak.
- **Operasi:** CRUD + Reorder.
- **Validasi:** `tag` pendek (maks 30 karakter), `title` non-empty, `description` non-empty.

### 5.4 Modul About Profile (`/admin/about`)
- **Tujuan:** Mengelola narasi biografi dan filosofi rekayasa perangkat lunak.
- **Data yang Dikelola:** `heading`, `quote`, `primaryNarrative`, `secondaryNarrative`.
- **Karakteristik:** Singleton mutlak (`id = 'singleton'`).
- **Operasi:** READ dan UPDATE.
- **Validasi:** Seluruh teks wajib terisi (non-empty string).

### 5.5 Modul Domains & Pillars (`/admin/domains` & `/admin/pillars`)
- **Tujuan:** Mengatur pemetaan domain kompetensi dan pilar metodologi.
- **Data yang Dikelola:**
  - `Domain`: `index` (misal '01'), `title`, `order`.
  - `Pillar`: `index` (misal '01'), `title`, `description`, `order`.
- **Karakteristik:** Koleksi jamak.
- **Operasi:** CRUD + Reorder.
- **Validasi:** `index` format kode konsisten, `title` wajib terisi.

### 5.6 Modul Projects (`/admin/projects`)
- **Tujuan:** Mengelola daftar studi kasus proyek rekayasa perangkat lunak.
- **Data yang Dikelola:** `title`, `category`, `description`, `technologies` (JSON array: `string[]`), `thumbnailUrl` (nullable), `projectUrl` (nullable), `githubUrl` (nullable), `published` (boolean), `publishedAt` (DateTime nullable), `order` (int).
- **Karakteristik:** Koleksi jamak.
- **Operasi:** Full CRUD, Toggle Publish/Draft, Reordering.
- **Validasi Khusus:**
  - `technologies` wajib divalidasi sebagai array of non-empty strings (misal via JSON parsing aman).
  - URL (jika diisi) wajib memiliki format HTTP/HTTPS valid.
  - Saat `published` diubah dari `false` ke `true`, jika `publishedAt` masih null, otomatis diisi timestamp sekarang.
- **Integritas Publik:** Proyek dengan `published: false` tidak pernah ditampilkan pada query public portfolio (`PrismaPortfolioRepository` memfilter `where: { published: true }`).

### 5.7 Modul Experiences (`/admin/experiences`)
- **Tujuan:** Mengelola rekam jejak karier, institusi, dan riwayat profesional.
- **Data yang Dikelola:** `role`, `institution`, `track`, `description` (nullable), `startDate` (DateTime nullable), `endDate` (DateTime nullable), `order` (int).
- **Karakteristik:** Koleksi jamak.
- **Operasi:** Full CRUD + Reorder.
- **Validasi Tanggal:** Jika `startDate` dan `endDate` terisi, `startDate` harus `<= endDate`. Jika posisi masih aktif, `endDate` bernilai null.

### 5.8 Modul Skills & Taxonomy (`/admin/skills`)
- **Tujuan:** Mengelola taksonomi keahlian teknis bertingkat (kategori dan item skill).
- **Data yang Dikelola:**
  - `SkillCategory`: `title`, `order`.
  - `Skill`: `name`, `categoryId` (Foreign Key ke `SkillCategory.id`), `order`.
- **Karakteristik:** Hierarki Parent-Child (Relasi 1:N dengan `onDelete: Cascade` di PostgreSQL).
- **Operasi:**
  - Category: Create, Update Title/Order, Delete (dengan konfirmasi eksplisit dampak cascading).
  - Skill: Create under Category, Update, Reassign Category, Delete, Reorder within Category.
- **Risiko:** Menghapus kategori akan menghapus seluruh skill di dalamnya. UI wajib menyertakan modal konfirmasi protektif.

### 5.9 Modul Contact Profile & Contact Channels (`/admin/contact` & `/admin/contact-channels`)
- **Tujuan:**
  - `ContactProfile`: Copywriting ajakan bertindak (singleton).
  - `ContactChannel`: Saluran komunikasi langsung (Email resmi, GitHub, LinkedIn).
- **Karakteristik:** `ContactProfile` adalah singleton; `ContactChannel` adalah koleksi.
- **Status Database:** `contact_channels` saat ini **0 rows** (masih kosong).
- **Aturan Provisi:** Admin dapat memasukkan data kontak resmi perdana tanpa placeholder melalui antarmuka ini.

### 5.10 Modul Account Settings (`/admin/account`)
- **Tujuan:** Manajemen kredensial administrator tunggal.
- **Data yang Dikelola:** `username`, `email` (opsional), `password` (enkripsi bcrypt cost 12).
- **Operasi:**
  - Update Username & Email.
  - Change Password: Wajib memverifikasi password saat ini (`currentPassword`), memastikan password baru memenuhi kebijakan ketat (min 12 karakter, uppercase, lowercase, angka, tidak memuat username).
  - Otomatis melakukan `incrementSessionVersion` saat ganti password untuk memutus seluruh sesi aktif di perangkat lain.
- **Penegakan Aturan:** Dilarang menambah akun admin baru (`SingleAdminPolicyViolation`).

---

## 6. Arsitektur Keamanan (Security Architecture)

Keamanan CMS dirancang mengikuti prinsip *Zero Trust* dan *Defense in Depth*, di mana setiap lapisan memverifikasi hak akses secara independen:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: CLIENT REQUEST & NEXT.JS 16 ROOT PROXY (proxy.ts)                             │
│ • Optimistic decode of iron-session cookie                                             │
│ • Rapid redirect to /admin/login if cookie missing or corrupted                         │
│ • Zero database overhead for bot/unauthenticated traffic                               │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Pass
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: NEXT.JS SERVER ACTIONS GATING (actions.ts)                                    │
│ • Next.js built-in Origin & Action ID CSRF protection                                  │
│ • Mandatory DAL verifySession() executed at top of every Action                        │
│ • Strict Input Parsing & Sanitization (Zero Mass-Assignment)                          │
│ • Granular Rate Limiting on mutation endpoints                                         │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ Authorized & Validated
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: DATA ACCESS LAYER (DAL) & DATABASE AUTHORITATIVE STORE                        │
│ • DAL verifySession() fetches Admin from PostgreSQL via Prisma                         │
│ • Validates dbAdmin.sessionVersion === session.sessionVersion                          │
│ • Instant rejection of revoked sessions (SessionRevokedException)                     │
│ • React cache() memoizes DB verification within single request lifecycle               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Proteksi CSRF & Mass-Assignment
- **CSRF:** Next.js Server Actions secara bawaan memvalidasi header `Origin` dan `Host`, serta menggunakan action identifier terisolasi. Permintaan POST dari origin yang tidak cocok otomatis ditolak oleh runtime Next.js.
- **Anti-Mass-Assignment:** Dilarang menyebarkan raw `FormData` atau `req.body` langsung ke Prisma (`data: { ...body }`). Setiap Server Action memetakan nilai satu per satu ke dalam DTO (Data Transfer Object) tervalidasi sebelum diteruskan ke Use Case.

### 6.2 Validasi Server-Side & Mitigasi XSS
- Seluruh validasi data dijalankan secara ketat di sisi server (Server Actions & Use Cases).
- Input teks disanitasi: whitespace di-trim, karakter kontrol disaring.
- Tampilan konten di Next.js menggunakan JSX default encoding (mencegah stored XSS). Tidak diperbolehkan penggunaan `dangerouslySetInnerHTML`.

### 6.3 Siklus Hidup & Pencabutan Sesi (Revocation)
- Sesi terenkripsi via `iron-session` dengan TTL 7 hari.
- Setiap aksi sensitif (ganti password atau klik tombol Logout) memicu inkremen atomik `sessionVersion` di PostgreSQL.
- Sesi aktif di perangkat lain yang membawa `sessionVersion` lama otomatis ditolak oleh DAL `verifySession()`.

---

## 7. Alur Bersih (Clean Architecture Flow)

Implementasi CMS mengikuti pemisahan tanggung jawab Clean Architecture yang ketat:

```
[ Admin UI (React Server/Client Component) ]
                     │ Form Submission / Action Call
                     ▼
[ Server Action (Presentation Adapter: app/admin/**/actions.ts) ]
  - verifySession()
  - Parse & sanitize FormData
  - Construct Input DTO
                     │ Calls Use Case
                     ▼
[ Application Layer (src/application/use-cases/admin/**) ]
  - Business Rules & Orchestration
  - Transaction Management
  - Invariant Checks (e.g., Singleton protection, Unique ordering)
                     │ Invokes Domain Contract
                     ▼
[ Domain Layer (src/domain/repositories/**) ]
  - Pure TypeScript Interfaces (e.g., IProjectAdminRepository)
  - Pure Domain Entities (e.g., Project, HeroProfile)
  - Zero dependency on Prisma or Next.js
                     │ Implemented by Infrastructure
                     ▼
[ Infrastructure Layer (src/infrastructure/repositories/**) ]
  - Prisma Implementations (e.g., PrismaProjectAdminRepository)
  - Prisma Client + @prisma/adapter-pg
                     │ SQL Queries
                     ▼
[ PostgreSQL Database (porto_cms) ]
```

### Dependency Inversion & Public Decoupling
- Lapisan Domain dan Application tidak pernah mengimpor `@prisma/client`.
- Public portfolio menggunakan `IPortfolioRepository` (`StaticPortfolioRepository` atau `PrismaPortfolioRepository`).
- CMS menggunakan repositori CUD admin terpisah (misal: `IProjectAdminRepository`, `IHeroAdminRepository`).
- `CompositionRoot` bertindak sebagai penyedia dependensi tunggal (Single Source of Truth) untuk instansiasi repositori dan use case.

---

## 8. Struktur Folder yang Direkomendasikan

```
src/
├── domain/
│   ├── entities/                        # Pure domain entities (existing & extended)
│   └── repositories/
│       ├── admin.repository.ts          # Existing Admin Auth repository contract
│       ├── hero-admin.repository.ts     # NEW: Contract for Hero & Roles & Nodes CUD
│       ├── about-admin.repository.ts    # NEW: Contract for About & Domains & Pillars CUD
│       ├── project-admin.repository.ts  # NEW: Contract for Project CUD
│       ├── experience-admin.repository.ts # NEW: Contract for Experience CUD
│       ├── skill-admin.repository.ts    # NEW: Contract for Skill Categories & Skills CUD
│       └── contact-admin.repository.ts  # NEW: Contract for Contact & Channels CUD
├── application/
│   └── use-cases/
│       ├── auth/                        # Existing: Login, Logout, Bootstrap
│       └── admin/                       # NEW: Modular CMS CUD Use Cases
│           ├── hero/
│           ├── about/
│           ├── projects/
│           ├── experiences/
│           ├── skills/
│           └── contact/
├── infrastructure/
│   ├── auth/                            # Existing DAL, session, rate-limiter, password
│   ├── composition-root.ts              # Extended: Wire all Admin CUD use cases
│   └── repositories/
│       ├── prisma-portfolio.repository.ts # Existing read-only public repository
│       ├── prisma-admin.repository.ts     # Existing admin auth repository
│       └── admin/                       # NEW: Prisma CUD Implementations
│           ├── prisma-hero-admin.repository.ts
│           ├── prisma-about-admin.repository.ts
│           ├── prisma-project-admin.repository.ts
│           ├── prisma-experience-admin.repository.ts
│           ├── prisma-skill-admin.repository.ts
│           └── prisma-contact-admin.repository.ts
app/
└── admin/
    ├── layout.tsx                       # Shared Admin Shell (DAL protected)
    ├── page.tsx                         # Dashboard Overview Hub
    ├── components/                      # Shared Swiss UI: Sidebar, Topbar, Breadcrumb
    ├── hero/page.tsx                    # Section Page: Hero Profile
    ├── roles/page.tsx                   # Section Page: Roles Manager
    ├── engineering-nodes/page.tsx       # Section Page: Engineering Nodes Manager
    ├── about/page.tsx                   # Section Page: About Profile
    ├── domains/page.tsx                 # Section Page: Domains Manager
    ├── pillars/page.tsx                 # Section Page: Pillars Manager
    ├── projects/
    │   ├── page.tsx                     # Section Page: Projects Table & List
    │   ├── new/page.tsx                 # Dedicated Page: Create Project
    │   └── [id]/page.tsx                # Dedicated Page: Edit Project
    ├── experiences/page.tsx             # Section Page: Experiences Manager
    ├── skills/page.tsx                  # Section Page: Skills & Categories Taxonomy
    ├── contact/page.tsx                 # Section Page: Contact Profile
    ├── contact-channels/page.tsx        # Section Page: Contact Channels Manager
    └── account/page.tsx                 # Section Page: Account Settings & Password
```

---

## 9. Rencana Implementasi Bertahap (Roadmap Stage 10.4)

Untuk memitigasi risiko regresi dan memastikan verifikasi tervalidasi di setiap langkah, Stage 10.4 dibagi menjadi fase-fase kecil yang independen:

- **Fase 1: Audit & Desain Arsitektur (Fase Ini — Status: Selesai)**
  - Audit kode aktual, perancangan antarmuka, spesifikasi modul, dan perumusan model keamanan.
- **Fase 2: Admin Shell, Shared Layout & Dashboard Hub**
  - Pembuatan `app/admin/layout.tsx`, komponen navigasi Swiss (Sidebar, Topbar, Breadcrumb, Mobile Drawer).
  - Transformasi `app/admin/page.tsx` dari harness sederhana menjadi Dashboard Overview Hub yang menampilkan ringkasan metrik 11 modul dan status sistem.
- **Fase 3: Core Singleton Modules (Hero, About, Contact Profiles)**
  - Implementasi kontrak repositori, implementasi Prisma, use case, Server Actions, dan UI untuk 3 model singleton (`HeroProfile`, `AboutProfile`, `ContactProfile`).
- **Fase 4: Work & Experience Collections (Projects & Experiences)**
  - Implementasi CRUD lengkap untuk `Project` (termasuk tag JSON technologies, toggle publish, form create/edit terpisah) dan `Experience` (linimasa karier, urutan, tanggal).
- **Fase 5: Structured Taxonomy & Focus Nodes (Skills, Roles, Engineering Nodes, Domains, Pillars)**
  - Implementasi pengelolaan kategori keahlian, skill items dengan integritas relasi foreign key, serta koleksi pendukung Hero & About.
- **Fase 6: Channels & Account Management**
  - Provisi perdana data `ContactChannel` (memungkinkan input email, GitHub, LinkedIn tanpa data placeholder).
  - Implementasi manajemen akun administrator tunggal (`/admin/account`) untuk pembaruan profil dan perubahan password terverifikasi.
- **Fase 7: Verifikasi End-to-End, Security Audit & Guardrail Check**
  - Audit database menyeluruh, uji coba mutasi data terisolasi, verifikasi proteksi DAL dan CSRF, serta memastikan integritas public portfolio tetap 100% terjaga.

---

## 10. Analisis Risiko & Mitigasi

| Risiko Potensial | Dampak | Strategi Mitigasi Arsitektural |
|---|---|---|
| **Kerusakan Data Public Portfolio** | TINGGI | Public portfolio tetap menggunakan repositori terpisah (`StaticPortfolioRepository` / `PrismaPortfolioRepository`). Seluruh perubahan CMS diuji pada database terisolasi sebelum di-publish. |
| **Bypass Otorisasi via Direct Server Action Call** | KRITIS | Setiap Server Action wajib memanggil `await verifySession()` sebelum memproses argumen atau mutasi. Server Action tidak mengandalkan client state. |
| **Cascading Delete Kehilangan Data (Skills)** | SEDANG | Penghapusan `SkillCategory` mewajibkan konfirmasi ganda pada UI dengan informasi jumlah skill yang akan ikut terhapus. |
| **Race Condition pada Ordering/Urutan Item** | RENDAH | Reordering dijalankan dalam transaksi atomik Prisma (`$transaction`) untuk memastikan tidak terjadi indeks urutan ganda/korup. |
| **Database Lock / Latency pada Session Check** | RENDAH | `verifySession()` di-memoize dalam lifecycle satu request HTTP menggunakan React `cache()`. Query DAL hanya mengambil kolom esensial (`id, username, sessionVersion`). |
| **Placeholder Data Leakage pada Channels** | SEDANG | Tabel `contact_channels` dibiarkan kosong hingga user secara sadar mengisi nilai resmi melalui UI Phase 6. Sistem validasi menolak teks placeholder umum (seperti `[ Placeholder ]`). |

---

## 11. Daftar Keputusan yang Membutuhkan Persetujuan User

Sebelum melanjutkan ke implementasi kode pada Fase 2, berikut adalah keputusan arsitektur yang memerlukan tinjauan dan konfirmasi eksplisit dari pengguna:

1. **Struktur Navigasi Per-Section:** Apakah struktur 13 halaman mandiri yang dikelompokkan ke dalam 3 grup navigasi (*Core*, *Portfolio Content*, *System*) sudah sesuai dengan preferensi alur kerja Anda?
2. **Desain Form Proyek Studi Kasus:** Untuk modul `Projects`, apakah alur pembuatan proyek lebih disukai menggunakan halaman tersendiri (`/admin/projects/new` dan `/admin/projects/[id]`) dibanding inline form/modal di halaman daftar proyek? (Rekomendasi arsitektur: halaman tersendiri untuk kenyamanan input deskripsi panjang dan tag teknologi).
3. **Penyimpanan Gambar/Thumbnail Proyek:** Pada skema saat ini, `thumbnailUrl` merupakan string URL. Apakah pendekatan input URL eksternal (CDN/Cloudinary/URL publik) sudah cukup, ataukah diperlukan utilitas upload file lokal di tahap berikutnya?
4. **Persetujuan Melanjutkan ke Fase 2:** Konfirmasi persetujuan terhadap dokumen arsitektur ini untuk memulai implementasi **Fase 2: Admin Shell, Shared Layout & Dashboard Hub**.
