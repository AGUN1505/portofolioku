# STAGE 10.3.1 — SECURITY AUDIT & AUTHENTICATION DESIGN REPORT

**Project:** `D:\portoku\porto`  
**Date:** 2026-11-07  
**Stage:** 10.3 — Phase 1 (Security Audit & Auth Architecture Design)  
**Execution Mode:** READ-ONLY AUDIT & DESIGN SPECIFICATION (Zero code mutations, Zero DB changes, Zero admin creation)  

---

## 1. EXISTING SECURITY AUDIT

Audit menyeluruh terhadap kondisi sistem saat ini (`D:\portoku\porto`):

### 1.1 Model `Admin` pada Prisma Schema (`prisma/schema.prisma`)
- Model didefinisikan dengan pemetaan tabel `@@map("admins")`.
- Kolom:
  - `id`: String CUID primary key (`@id @default(cuid())`).
  - `username`: String `@unique`. Catatan: PostgreSQL secara default case-sensitive. Input username wajib dinormalisasi (`.toLowerCase().trim()`) di application layer agar tidak terjadi akun ganda (misal `admin` vs `Admin`).
  - `passwordHash`: String untuk menyimpan hash bcrypt.
  - `email`: String opsional `@unique`.
  - `sessionVersion`: Int default 1. Mekanisme krusial untuk instant session revocation pada logout atau penggantian password.
  - `createdAt`, `updatedAt`: Timestamps standar.
- Status data aktual: **0 records** (bersih, belum ada akun admin).

### 1.2 Domain Entity `Admin` (`src/domain/entities/admin.ts`)
- Antarmuka:
  ```typescript
  export interface Admin {
    readonly id: string;
    readonly username: string;
    readonly email?: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }
  ```
- **Audit:** Entity domain bersih dari `passwordHash` dan `sessionVersion`. Informasi kredensial dan state sesi terisolasi di infrastructure layer.

### 1.3 Struktur Clean Architecture
- **Presentation:** Public portfolio (`app/page.tsx`, `src/presentation/components/*`, `src/presentation/mappers/*`). Tidak ada coupling ke database.
- **Application:** Use cases murni (`src/application/use-cases/*`). Belum ada use case admin/auth.
- **Domain:** Entities dan repository contracts murni (`src/domain/entities/*`, `src/domain/repositories/*`). Zero Prisma dependencies.
- **Infrastructure:** Prisma client (`src/infrastructure/prisma/client.ts`), mappers, repositories, dan composition root (`src/infrastructure/composition-root.ts`).
- **Audit:** Batasan arsitektural solid. Auth service dan DAL akan ditempatkan di layer infrastructure tanpa mengotori domain.

### 1.4 Prisma Client & Repository
- Singleton `prisma` menggunakan `@prisma/adapter-pg` dengan lazy `Proxy` wrapper (`src/infrastructure/prisma/client.ts`).
- Mengisolasi koneksi ke `porto_cms` pada `localhost:5432`.
- Throw descriptive error bila `DATABASE_URL` tidak tersedia.

### 1.5 Dependency Injection / Composition Root
- `src/infrastructure/composition-root.ts` telah memisahkan instansiasi static repository vs database repository.
- Siap diperluas untuk menginjeksi `IAdminRepository`, `AuthService`, dan use case otentikasi.

### 1.6 Environment Variable Handling
- `.env.local` memuat `DATABASE_URL`, `SESSION_SECRET`, dan `TRUSTED_PROXIES`.
- File masuk `.gitignore` (untracked).
- Variabel tidak menggunakan prefix `NEXT_PUBLIC_`, sehingga terjamin tidak pernah bocor ke client bundle.
- Nilai secret dirahasiakan (`[REDACTED]`).

### 1.7 Next.js 16 Routing & Konvensi `proxy.ts`
- Sesuai dokumentasi resmi Next.js 16 (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`):
  - File konvensi `middleware.ts` sudah **deprecated** dan digantikan oleh `proxy.ts` di root project.
  - Fungsi diekspor sebagai `export function proxy(request: NextRequest)`.
  - Runtime `proxy.ts` adalah `nodejs` (bukan `edge`).
  - Proxy berfungsi untuk **optimistic redirect** (UX cepat). Otorisasi mutlak tetap wajib di Data Access Layer (DAL) server-side.

### 1.8 Server Actions & Route Handlers
- Audit direktori `app/`:
  - Belum ada Route Handler (`app/api/...`) maupun Server Action CMS yang terpasang.
  - Public portfolio menggunakan Server Component murni.
  - Seluruh endpoint CMS yang akan dibangun di Phase 2+ dapat dirancang secara zero-trust sejak awal.

### 1.9 Package Keamanan Terpasang
- `package.json` sudah memiliki dependensi:
  - `iron-session`: `^9.0.1` (enkripsi cookie stateless bertanda tangan AES-256).
  - `bcryptjs`: `^3.0.3` (komputasi adaptive hash password).
  - `@types/bcryptjs`: `^2.4.6`.
- Tidak ada dependensi tambahan yang diperlukan.

### 1.10 Dokumentasi Autentikasi Stage 10.1
- Selaras dengan cetak biru `.hermes/stage-10.1-cms-architecture.md`:
  - Single-admin architecture.
  - Iron Session via encrypted cookie (`httpOnly`, `sameSite: 'lax'`, `secure: production`).
  - Multi-tier defense: `proxy.ts` (optimistic redirect) + `verifySession()` (DAL server-side enforcement).
  - Session revocation via `Admin.sessionVersion`.

---

## 2. THREAT ASSESSMENT & MITIGATION MATRIX

| Ancaman (Threat) | Vektor Risiko | Mitigasi Arsitektural |
|---|---|---|
| **Brute-Force Login** | Penyerang mencoba ribuan kombinasi password pada form login admin. | Rate limiter 5 percobaan / 15 menit per username & per IP. Eksekusi rate limit *sebelum* bcrypt verification untuk mencegah CPU exhaustion. Fail-closed. |
| **Credential Stuffing** | Penyerang menggunakan password dumps publik. | Enkripsi bcrypt dengan cost factor 12 rounds. Enforce minimum length password policy pada bootstrap admin (min 12 karakter). |
| **Session Fixation** | Penyerang menyusupkan session ID yang telah ditentukan sebelumnya. | Iron Session mengenkripsi seluruh payload menjadi token tertutup (`sealData`) dengan timestamp expiry; session baru selalu dibuat ulang saat login berhasil. |
| **Session Hijacking** | Pencurian cookie sesi pengguna melalui sniffing atau XSS. | Cookie disetel dengan flags `httpOnly: true` (tidak bisa diakses JavaScript browser), `secure: true` (hanya HTTPS di produksi), `sameSite: 'lax'`. |
| **CSRF (Cross-Site Request Forgery)** | Website berbahaya mengeksekusi aksi CMS atas nama admin yang sedang login. | Server Actions Next.js secara native memvalidasi Host/Origin headers + Cookie `sameSite: 'lax'`. |
| **XSS (Cross-Site Scripting)** | Eksekusi script injeksi di browser admin. | React JSX auto-escaping, tidak ada `dangerouslySetInnerHTML` pada data CMS yang tidak terverifikasi, cookie session dilindungi `httpOnly`. |
| **Session Stale / Invalidation Failure** | Admin logout di satu browser tetapi sesi di browser lain tetap aktif. | Kolom `sessionVersion` pada DB. Setiap request DAL memeriksa `sessionVersion` di cookie vs DB. Jika `sessionVersion` DB dinaikkan (logout/ganti password), semua sesi lama otomatis gugur. |
| **Bypass via Direct Server Action Calling** | Penyerang memanggil Server Action CMS secara langsung tanpa melewati navigasi UI / proxy. | Setiap Server Action dan Route Handler CMS **wajib** memanggil `verifySession()` DAL di baris pertama eksekusinya. Proxy tidak pernah dijadikan andalan tunggal. |
| **Open Redirect** | Penyerang mengarahkan redirect login ke URL eksternal berbahaya via query `?from=//evil.com`. | Validasi ketat target redirect: hanya menerima path relatif yang diawali `/admin/` dan tidak diawali `//` atau protokol eksternal. |
| **Timing Attack** | Penyerang mengukur waktu respons login untuk mendeteksi apakah username valid. | Eksekusi dummy bcrypt compare ketika username tidak ditemukan, sehingga latensi respons tetap konstan (~100ms). |
| **Information Leakage** | Error pesan membocorkan detail spesifik (misal: "User tidak ditemukan" vs "Password salah"). | Pesan error generik: `"Invalid credentials"`. Log internal mencatat detail keamanan tanpa mencetak password. |

---

## 3. AUTHENTICATION ARCHITECTURE

Arsitektur pertahanan berlapis (Defense-in-Depth):

```
+-------------------------------------------------------------------------+
| [LAYER 1] EDGE / NETWORK BOUNDARY: proxy.ts (Root)                      |
| - Membaca encrypted cookie 'session' (NextRequest)                      |
| - Melakukan dekripsi ringan (unsealData)                                |
| - Optimistic Redirect:                                                  |
|   * Akses /admin/* tanpa sesi valid  --> Redirect ke /admin/login       |
|   * Akses /admin/login dengan sesi valid --> Redirect ke /admin/dashboard|
+------------------------------------+------------------------------------+
                                     | (Authorized navigation passes)
                                     v
+-------------------------------------------------------------------------+
| [LAYER 2] PRESENTATION LAYER (Server Components & Server Actions)       |
| - UI Login Form: app/admin/login/page.tsx                               |
| - Login Server Action: app/admin/login/actions.ts                       |
| - Protected CMS Pages: app/admin/(dashboard)/layout.tsx                 |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [LAYER 3] DATA ACCESS LAYER (DAL): verifySession()                      |
| - Wajib dipanggil oleh SEMUA Server Actions & Protected Page Layouts    |
| - Mengambil cookie session via next/headers                             |
| - Memverifikasi validitas kriptografis (AES-256 Iron Session)           |
| - Memverifikasi Expiration timestamp                                    |
| - Memverifikasi sessionVersion ke DB (Prisma Admin query)               |
| - Throw 'Unauthorized' jika ada anomali atau versi tidak cocok          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [LAYER 4] APPLICATION & DOMAIN LAYER                                    |
| - LoginAdminUseCase, LogoutAdminUseCase                                 |
| - IAdminRepository, IRateLimiter                                        |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| [LAYER 5] INFRASTRUCTURE LAYER                                          |
| - PrismaAdminRepository (DB Access)                                     |
| - PasswordService (bcryptjs hashing & timing-safe compare)              |
| - IronSessionService (sealData, unsealData)                             |
| - RateLimiter (Memory / PG Advisory Lock)                               |
+-------------------------------------------------------------------------+
```

---

## 4. LOGIN & LOGOUT SEQUENCE

### 4.1 Login Sequence
1. **User Request:** Admin memasukkan username dan password pada form login `/admin/login`.
2. **Server Action Dispatch:** Form submit mentrigger `loginAction(formData)` di server.
3. **Input Sanitization & Normalization:**
   - `username = (formData.get('username') as string).trim().toLowerCase()`
   - `password = (formData.get('password') as string)`
   - Validasi panjang minimal dan tipe input.
4. **Rate Limit Gatekeeper (PRE-BCRYPT):**
   - Ambil IP client via `getClientIP()` (memeriksa `TRUSTED_PROXIES`).
   - Cek batas percobaan: `rateLimiter.isAllowed(username, ip)`.
   - Jika limit terlampaui (>= 5 percobaan dalam 15 menit):
     - Return error: `"Too many login attempts. Please try again in 15 minutes."` (Status 429).
     - **Eksekusi berhenti sebelum bcrypt dipanggil** (mencegah DoS CPU).
5. **Credential Verification:**
   - Cari admin di database via `adminRepository.findByUsername(username)`.
   - Jika admin TIDAK ditemukan:
     - Catat percobaan gagal di rate limiter: `rateLimiter.recordFailure(username, ip)`.
     - Jalankan *dummy bcrypt compare* (konstan timing) dengan hash dummy.
     - Return error: `"Invalid credentials"`.
   - Jika admin ditemukan:
     - Bandingkan password via `bcrypt.compare(password, admin.passwordHash)`.
     - Jika TIDAK cocok:
       - Catat percobaan gagal di rate limiter: `rateLimiter.recordFailure(username, ip)`.
       - Return error: `"Invalid credentials"`.
6. **Session Creation:**
   - Bersihkan riwayat kegagalan di rate limiter: `rateLimiter.reset(username, ip)`.
   - Buat payload sesi:
     ```typescript
     const payload: SessionPayload = {
       userId: admin.id,
       username: admin.username,
       sessionVersion: admin.sessionVersion,
       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
     };
     ```
   - Enkripsi payload via `iron-session` (`sealData`).
7. **Set Encrypted Cookie:**
   - Set cookie `session` dengan atribut:
     - `httpOnly: true`
     - `secure: process.env.NODE_ENV === 'production'`
     - `sameSite: 'lax'`
     - `maxAge: 7 * 24 * 60 * 60` (7 hari)
     - `path: '/'`
8. **Redirect:**
   - Redirect aman ke target (`/admin/dashboard` atau URL query `from` yang telah divalidasi).

### 4.2 Logout Sequence
1. **User Request:** Admin menekan tombol Logout pada CMS.
2. **Server Action Dispatch:** Mentrigger `logoutAction()`.
3. **DAL Check:** Mengambil sesi aktif dari cookie.
4. **Session Invalidation di Database:**
   - Increment `sessionVersion`:
     `await adminRepository.incrementSessionVersion(userId)`
   - Efek: Seluruh sesi aktif di semua browser atau perangkat milik admin tersebut seketika tidak valid.
5. **Clear Cookie:**
   - Hapus cookie `session` (`cookieStore.delete('session')` atau set `maxAge: 0`).
6. **Redirect:**
   - Redirect ke `/admin/login`.

---

## 5. SESSION LIFECYCLE & INVOLVEMENT

### 5.1 Struktur Payload Sesi
```typescript
export interface SessionPayload {
  readonly userId: string;
  readonly username: string;
  readonly sessionVersion: number;
  readonly expiresAt: string; // ISO 8601 string
}
```

### 5.2 Siklus Hidup Sesi
1. **Penerbitan (Issuance):** Dibuat saat autentikasi sukses dengan `expiresAt` = `Date.now() + 7 hari`.
2. **Transportasi:** Disimpan dalam cookie HTTP-only terenkripsi AES-256-GCM. Kunci enkripsi berasal dari `SESSION_SECRET` (min 32 karakter).
3. **Pemeriksaan Cepat (Optimistic in `proxy.ts`):**
   - Mendekripsi cookie tanpa query database untuk meredirect tamu yang mencoba membuka halaman admin.
4. **Verifikasi Otoritatif (Authoritative in DAL `verifySession`):**
   - Dilakukan setiap kali Server Component atau Server Action di `/admin/*` dieksekusi.
   - Mengambil data `sessionVersion` langsung dari database PostgreSQL.
   - Jika `dbAdmin.sessionVersion !== sessionPayload.sessionVersion`, sesi ditolak dengan error `SessionRevokedException`.
5. **Kedaluwarsa (Expiration):**
   - Jika `new Date() > new Date(expiresAt)`, unsealData gagal atau ditolak DAL. Cookie dibersihkan.
6. **Revokasi Instan (Invalidation):**
   - Logout menaikkan nilai `Admin.sessionVersion` di tabel database. Tidak membutuhkan blacklist store terpisah.

---

## 6. AUTHORIZATION STRATEGY & DEFENSE-IN-DEPTH

Sistem CMS mengimplementasikan arsitektur otorisasi single-admin tanpa celah:

### 6.1 Lapisan 1: Root Proxy (`proxy.ts`)
- Memotong request navigasi sebelum mencapai render engine.
- Membaca cookie `session`.
- Mengarahkan request unauthenticated ke `/admin/login`.
- **Bukan batas otorisasi final** (hanya navigasi UX).

### 6.2 Lapisan 2: Layout Guard (`app/admin/(dashboard)/layout.tsx`)
- Server Component layout yang membungkus semua halaman CMS.
- Memanggil `await verifySession()`. Jika gagal, melempar redirect atau error boundary.

### 6.3 Lapisan 3: Server Action DAL Guard (The Real Castle Wall)
- **Aturan Mutlak:** Setiap Server Action yang melakukan operasi baca/tulis di CMS wajib mengeksekusi `await verifySession()` pada baris pertama sebelum membaca payload form atau menyentuh use case.
- Contoh:
  ```typescript
  'use server';
  import { verifySession } from '@/src/infrastructure/auth/dal';

  export async function updateHeroAction(formData: FormData) {
    const session = await verifySession(); // Mandatory barrier
    // ... eksekusi bisnis
  }
  ```

### 6.4 Lapisan 4: Route Handlers (Jika Ada di Masa Depan)
- Jika dibuat endpoint API (`/api/admin/*`), wajib mengembalikan `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` jika `verifySession()` melempar exception.

---

## 7. PASSWORD SECURITY & HASHING

1. **Algoritma:** bcrypt (`bcryptjs`).
2. **Work Factor / Salt Rounds:** 12 rounds.
   - Waktu komputasi ~100-250ms per hash pada hardware modern.
   - Memberikan resistensi optimal terhadap serangan brute force GPU/FPGA offline.
3. **Kebijakan Password Admin (Enforced at Bootstrap):**
   - Panjang minimal: 12 karakter.
   - Kompleksitas: Wajib mengandung huruf besar, huruf kecil, dan angka.
   - Tidak boleh mengandung substring username.
4. **Timing-Attack Resistance:**
   - Jika user tidak ditemukan, sistem mengeksekusi perbandingan dummy hash bcrypt:
     ```typescript
     const DUMMY_HASH = '$2a$12$e8hYqLhK4O8T9aV7X6bZ1O9q8w7e6r5t4y3u2i1o0p9a8s7d6f5g4';
     await bcrypt.compare(password, DUMMY_HASH);
     ```
   - Mencegah penyerang menduga validitas username berdasarkan variasi durasi respons.
5. **Storage:**
   - Password plaintext **dilarang keras** ditulis ke storage, database, file log, atau session payload.

---

## 8. RATE LIMITING DESIGN

### 8.1 Spesifikasi
- **Threshold:** Maksimal 5 percobaan gagal per jendela 15 menit (900 detik).
- **Dimensi:**
  1. `username` (melindungi akun spesifik dari serangan terdistribusi).
  2. `client_ip` (melindungi endpoint dari serangan credential stuffing multi-user).
  3. Kombinasi `username:ip`.
- **Fail-Closed Policy:** Jika engine rate limit mengalami kegagalan/error, operasi login admin **ditutup sementara** untuk menjamin keamanan.

### 8.2 Evaluasi Engine Rate Limiter untuk Project Ini
Terdapat 3 opsi yang dievaluasi:
1. **Redis / Upstash (Produksi Cloud / Serverless):**
   - Sangat cepat (<5ms), atomic Lua scripting, TTL otomatis.
   - *Status untuk project ini:* Belum ada service Redis di lingkungan lokal Laragon. Menambahkan Redis eksternal melanggar aturan "jangan menambahkan layanan eksternal tanpa izin".
2. **PostgreSQL-backed (`login_attempts` table):**
   - Menggunakan tabel terpisah dan `pg_advisory_xact_lock`.
   - *Status untuk project ini:* Memerlukan migrasi baru untuk membuat tabel `login_attempts`. Saat ini migrasi dilarang tanpa izin pengguna.
3. **In-Memory Sliding Window (Local Node.js Development - Direkomendasikan untuk Tahap Ini):**
   - Menggunakan struktur data memory map dengan sliding window timestamp di instance Node.js.
   - Sangat efisien, zero latency, tidak membutuhkan migrasi DB, tidak membutuhkan service Redis eksternal.
   - *Rekomendasi:* Gunakan interface `IRateLimiter` di domain/infrastructure. Sediakan `MemoryRateLimiter` untuk lingkungan lokal Laragon saat ini. Sediakan jalur upgrade ke Redis atau PostgreSQL saat deploy ke production.

### 8.3 Penanganan IP & Trusted Proxy
- Sesuai dengan konfigurasi `.env.local`: `TRUSTED_PROXIES=""` (kosong di local development).
- Jika `TRUSTED_PROXIES` kosong, sistem tidak mempercayai header `X-Forwarded-For` untuk mencegah spoofing IP.
- Rate limiting di local fallback secara aman ke dimensi `username`.
- IPv6 dinormalisasi untuk menjaga akurasi subnet jika beroperasi di lingkungan publik.

---

## 9. ADMIN BOOTSTRAP STRATEGY

Status database saat ini: **Tabel `admins` berisi 0 records.**

Mekanisme bootstrap yang aman dan idempotent:
1. **Dilarang keras:**
   - Tidak ada default username / password di codebase.
   - Tidak ada endpoint registrasi publik di browser (`/admin/register` dilarang).
   - Tidak ada hardcoded credentials di file migration atau seed.
2. **Metode Bootstrap yang Disetujui: Dedicated CLI Script**
   - Script: `scripts/bootstrap-admin.ts`.
   - Dijalankan secara lokal melalui terminal: `npx tsx scripts/bootstrap-admin.ts`.
3. **Mekanisme Eksekusi Bootstrap:**
   - **Step 1 — Single-Admin Enforcement:** Query `SELECT COUNT(*) FROM admins;`. Jika `count > 0`, script langsung menghentikan proses:
     `[ERROR] Single-admin policy: Admin account already exists. Bootstrap aborted.`
   - **Step 2 — Secure Input:** Meminta username dan password interaktif via secure stdin (atau via environment variables yang di-pass sekali pakai saat eksekusi CLI).
   - **Step 3 — Password Validation:** Memvalidasi panjang minimal (>= 12 karakter) dan kekuatan karakter.
   - **Step 4 — Password Hashing:** Menghash password dengan `bcryptjs` (salt 12 rounds).
   - **Step 5 — Insertion:** Insert 1 record ke tabel `admins` dengan `sessionVersion: 1`.
   - **Step 6 — Zero-Trace:** Output hanya mencatat konfirmasi sukses tanpa mencetak password.
4. **Proteksi Single-Admin di Application Layer:**
   - Pada `IAdminRepository` dan use case, dibuat validasi: jika jumlah admin sudah >= 1, pembuatan akun admin baru ditolak secara permanen.

---

## 10. FILE STRUCTURE YANG AKAN DIBUAT / DIUBAH (FASE BERIKUTNYA)

Struktur file yang direncanakan untuk implementasi autentikasi (Phase 2 & Phase 3):

```
porto/
├── proxy.ts                                     # [BARU] Root Next.js 16 Proxy untuk navigasi optimistik
├── scripts/
│   └── bootstrap-admin.ts                       # [BARU] Script CLI aman untuk inisialisasi akun admin
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── admin.ts                         # [EKSISTING] Entity Admin domain
│   │   └── repositories/
│   │       ├── admin.repository.ts              # [BARU] Interface IAdminRepository
│   │       └── rate-limiter.interface.ts        # [BARU] Interface IRateLimiter
│   ├── application/
│   │   └── use-cases/
│   │       └── auth/
│   │           ├── login-admin.ts               # [BARU] Use case login admin
│   │           ├── logout-admin.ts              # [BARU] Use case logout & session bump
│   │           └── verify-admin-session.ts      # [BARU] Use case validasi sesi
│   └── infrastructure/
│       ├── auth/
│       │   ├── session.ts                       # [BARU] Iron-session seal/unseal & session payload
│       │   ├── password.service.ts              # [BARU] Bcryptjs hashing & timing-safe compare
│       │   ├── dal.ts                           # [BARU] verifySession() Data Access Layer guard
│       │   ├── memory-rate-limiter.ts           # [BARU] Sliding window in-memory rate limiter
│       │   └── ip-extractor.ts                  # [BARU] Safe IP extraction & trusted proxy logic
│       ├── repositories/
│       │   └── prisma-admin.repository.ts       # [BARU] Implementasi Prisma untuk IAdminRepository
│       └── composition-root.ts                  # [UPDATE] Wiring admin repo & auth services
└── app/
    └── admin/
        ├── login/
        │   ├── page.tsx                         # [BARU] Form login admin (Swiss Editorial UI)
        │   └── actions.ts                       # [BARU] Server Action login
        └── (dashboard)/                         # [FUTURISTIC / PHASE CMS]
            └── layout.tsx                       # [BARU] Protected layout dengan verifySession()
```

---

## 11. DEPENDENCIES YANG DIPERLUKAN

- **Semua dependensi sudah terpasang di `package.json`**:
  - `iron-session`: `^9.0.1` (sudah terinstall)
  - `bcryptjs`: `^3.0.3` (sudah terinstall)
  - `@types/bcryptjs`: `^2.4.6` (sudah terinstall)
  - `@prisma/client`: `^7.10.1` (sudah terinstall)
  - `@prisma/adapter-pg`: `^7.10.1` (sudah terinstall)
- **Tidak ada package tambahan yang perlu diinstal.**

---

## 12. IMPLEMENTATION ROADMAP (STAGE 10.3)

- **Phase 1 — Security Audit & Auth Design (CURRENT — COMPLETE):**
  - Audit status keamanan eksisting.
  - Dokumentasi ancaman, arsitektur pertahanan berlapis, lifecycle sesi, rate limiting, bootstrap admin.
  - Review & Approval oleh user.
- **Phase 2 — Core Auth Infrastructure & Services:**
  - Implementasi `session.ts` (Iron Session helper).
  - Implementasi `password.service.ts` (Bcrypt).
  - Implementasi `IAdminRepository` & `PrismaAdminRepository`.
  - Implementasi `dal.ts` (`verifySession()`).
  - Implementasi `IRateLimiter` & `MemoryRateLimiter`.
  - Update `composition-root.ts`.
- **Phase 3 — Admin Bootstrap & Authentication Workflows:**
  - Pembuatan script aman `scripts/bootstrap-admin.ts`.
  - Eksekusi bootstrap admin (hanya atas perintah eksplisit user).
  - Implementasi use case `LoginAdminUseCase` & `LogoutAdminUseCase`.
  - Pembuatan `proxy.ts` (Next.js 16 convention).
- **Phase 4 — Presentation Layer (Login UI & Protection):**
  - Pembuatan halaman `/admin/login` dengan desain Swiss / International Typographic Style (konsisten dengan warm off-white `#F7F6F2`, border 1px, typography tajam).
  - Server Action `loginAction` & `logoutAction`.
  - Protected layout guard untuk CMS.
- **Phase 5 — Testing, Verification & Final Report:**
  - Automated test suite untuk auth lifecycle (login sukses, login gagal, rate limit trigger, session invalidation).
  - Negative test suite (bypass attempt, expired cookie, tampered version).
  - Build & lint verification.

---

## 13. TESTING STRATEGY

Pengujian yang wajib dilakukan pada fase implementasi:
1. **Unit Tests (Pure Logic):**
   - Hashing & timing-safe password compare (`password.service.ts`).
   - Session seal & unseal dengan TTL dan tampered secret handling (`session.ts`).
   - Sliding window calculation & reset pada `MemoryRateLimiter`.
2. **Integration Tests (Database & Repository):**
   - `PrismaAdminRepository.findByUsername()` dengan normalisasi lowercase.
   - `PrismaAdminRepository.incrementSessionVersion()` dan verifikasi perubahan di PostgreSQL.
   - Enforce single-admin: pembuatan akun kedua wajib melempar exception.
3. **Security Barrier Tests (DAL & Actions):**
   - Panggilan Server Action tanpa cookie -> Rejection (Status 401 / Exception).
   - Panggilan Server Action dengan tampered cookie -> Rejection.
   - Panggilan Server Action dengan versi sesi lama (setelah logout) -> Rejection.
   - Trigger rate limiter (5 kali gagal berturut-turut) -> Rejection status 429 pada percobaan ke-6.
4. **End-to-End Navigation & UX:**
   - Navigasi ke `/admin/dashboard` tanpa login diarahkan ke `/admin/login` oleh `proxy.ts`.
   - Login berhasil mengarahkan ke dashboard dan menyetel cookie HTTP-only.
   - Public portfolio `/` tetap 100% statis dan tidak terpengaruh oleh state sesi admin.

---

## 14. RISIKO & KEPUTUSAN YANG MEMERLUKAN PERSETUJUAN USER

Sebelum melangkah ke Phase 2 (Implementasi), keputusan berikut memerlukan konfirmasi pengguna:

1. **Pemilihan Engine Rate Limiter:**
   - *Rekomendasi:* Gunakan `MemoryRateLimiter` (in-memory sliding window) untuk tahap local development saat ini agar tidak memerlukan penambahan tabel/migrasi DB baru dan tidak memerlukan instalasi Redis eksternal.
   - *Alternatif:* Buat tabel migrasi `login_attempts` di PostgreSQL (memerlukan modifikasi `prisma/schema.prisma` dan migrasi baru).
2. **Eksekusi Admin Bootstrap:**
   - Pembuatan akun admin (username/password) hanya akan dilakukan pada Phase 3 melalui script interaktif yang dijalankan di terminal bersama pengguna. Tidak ada akun admin default.
3. **Konvensi Next.js 16 `proxy.ts`:**
   - Dikonfirmasi menggunakan `proxy.ts` sesuai pedoman resmi Next.js 16 (menggantikan `middleware.ts`).

---
**STATUS: PHASE 1 COMPLETED. AWAITING USER APPROVAL TO PROCEED TO PHASE 2.**


