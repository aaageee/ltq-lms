# Progress Build — LTQ Markaz AlQuran LMS

## Update Terakhir
Tanggal : 1 November 2026
IDE      : OpenCode
Branch   : development

## Status Modul

### MVP (Target: 4–6 minggu)
- [x] M0-A — Setup monorepo + struktur folder
- [x] M0-B — Prisma schema + Docker Compose (postgres/backend/frontend saja)
- [x] M1-A — Backend auth (login, JWT, middleware RBAC, seeder 5 akun)
- [x] M1-B — Frontend login + shortcut dev + dashboard dummy semua role
- [ ] M2   — Admin: CRUD program, kelas, guru
- [ ] M3-A — Backend PSB: input peserta, NoID, assign kelas, upload ke /uploads
- [ ] M3-B — Frontend PSB: form multi-step + halaman detail peserta
- [ ] M4-A — Backend SPP: invoice, konfirmasi bayar (TU|BENDAHARA), kwitansi PDF
- [ ] M4-B — Frontend SPP: buat invoice, konfirmasi, download kwitansi
- [ ] M4-C — Integrasi Fonnte WA (template persis PRD §15, trigger #1–#3, #5)
- [ ] M5   — Guru: presensi + nilai (1 transaksi) + cuti badal
- [ ] M6   — Guru: raport PDF + kenaikan level + approval admin + WA #5
- [ ] M7-A — Backend bendahara: kas (SPP derive dari payments), penggajian, export
- [ ] M7-B — Frontend bendahara: dashboard kas + penggajian
- [ ] M10  — Scheduled job harian node-cron (overdue invoice + backup DB)

### Ditunda (post-MVP)
- ⏸️ M8   — Daftar ulang semester + WA blast (MVP: TU proses manual via invoice)
- ⏸️ M9   — Super Admin CRUD cabang/akun admin (MVP: akun dari seeder)

## Catatan Per Modul
<!-- Isi setelah tiap modul selesai -->
### M1-B
- Status: ✅ selesai (1 Nov 2026)
- **UI terlihat & terverifikasi di browser** — semua route lolos lint + build + 0 console error:
  `/login`, `/dashboard/admin`, `/dashboard/guru`, `/dashboard/tu`, `/dashboard/bendahara`, `/dashboard/super-admin`
- Sistem login: form + 5 tombol shortcut (tampil hanya jika `NEXT_PUBLIC_DEV_MODE=true`); redirect per role via `ROLE_HOME`
- Auth state: Zustand + persist (localStorage key `ltq-auth`); `ProtectedRoute` cek auth+role setelah rehydrate
- ⚠️ **Deviasi**: shadcn/ui CLI **tidak dipakai** — komponen gaya shadcn (Card/Button/Badge/Input/Table/Skeleton) dibuat manual di `src/components/ui/` (Opsi Ringan: tanpa radix, kontrol penuh)
- Layout: sidebar collapsible (desktop) + drawer (mobile hamburger), topbar dengan badge role berwarna, ikon lucide-react
- Chart: Recharts (bar "Peserta per Program" di admin, donut "Komposisi Pemasukan" di bendahara)
- Skeleton loading via `useSimulatedLoad(400ms)` — saat M2 pakai TanStack Query, ganti dengan `isFetching` query
- Dummy login mode: `NEXT_PUBLIC_DEV_MODE=true` (`.env.local`); set false untuk hit API backend M1-A (sudah jalan di :4000)
- KPI value pakai wrap (bukan truncate) agar angka rupiah tidak terpotong di layar sempit
- **Deploy review (GitHub Pages)**: `STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/ltq-lms npm run build` → `out/`; workflow `.github/workflows/deploy-pages.yml` build & publish otomatis saat push ke `development`/`main`. Sudah dites lokal via sub-path `/ltq-lms/` (0 error, 0 request gagal)

### M1-A
- Status: ✅ selesai (1 Nov 2026)
- Endpoint: POST /api/auth/login, /refresh, /logout + GET /api/auth/me (tambahan: hydrate state frontend)
- JWT access 15m + refresh 7d di httpOnly cookie (path: /api/auth, sameSite lax; secure saat NODE_ENV=production)
- Middleware: `verifyToken.ts` (inject req.user) + `requireRole.ts` (contoh: `requireRole(["ADMIN_CABANG","TU"])`)
- bcryptjs cost 12 (bukan bcrypt native — portabel di alpine/docker); Zod validasi body login; pesan error sama untuk email tak dikenal & password salah (anti enumeration)
- Seeder: 1 cabang JKT + 5 akun (superadmin/admin/guru/tu/bendahara@ltq.id), password `admin123` ⚠️ ganti sebelum deploy
- Test curl: 11 skenario lolos (login sukses/gagal×3, me valid/no-token/palsu, refresh valid/no-cookie, logout)
- Deps baru: zod, bcryptjs, jsonwebtoken, cookie-parser, ts-node (dev)

### M0-B
- Status: ✅ selesai (1 Nov 2026)
- Prisma schema lengkap 21 model + 14 enum; migration `20261031172904_init` terpasang & client generated
- DB lokal: `ltq_lms` @ `kursus:kursus_dev@localhost:5432` (kredensial di `backend/.env`, Docker tidak tersedia)
- docker-compose.yml (postgres+backend+frontend, tanpa redis/minio) + Dockerfile + .dockerignore — ⚠️ belum dites (tidak ada Docker di mesin dev)
- Nama kolom ikut konvensi Prisma camelCase (PRD §6 snake_case hanya konseptual)
- Frontend pakai `next.config.mjs` (bukan .ts) — Dockerfile menyesuaikan

### M0-A
- Status: ✅ selesai (1 Nov 2026)
- Next.js 14 → **16.4.3** (React 19, ESLint 9 flat config `eslint-config-next@16`) — alasan: 14 sudah EOL, 21 vulnerability tanpa patch; 16.4.3 audit **0 vuln**
- Backend: Express + TS strict (`tsc --noEmit` lolos), struktur src/{routes,middleware,services,utils}, tanpa route (mulai M1-A)
- ⚠️ Docker **tidak tersedia** di mesin dev → M0-B pakai **PostgreSQL lokal** (docker-compose tetap dibuat untuk deploy VPS)
- ⚠️ Prisma 6.19.3: 3 high (deepmerge-ts) — tanpa fix dalam major 6; tunda upgrade Prisma 7
- ⚠️ 16 moderate frontend = `minimatch <11.0.1` (dev tooling) — non-blocking
- ⚠️ gh CLI tidak ada → `git push` ditunda sampai remote GitHub disiapkan

## Masalah Aktif
<!-- Catat bug atau blocker yang belum selesai -->
- ✅ **Review live**: https://aaageee.github.io/ltq-lms/ (GitHub Pages, auto-deploy saat push ke `development`). Repo: https://github.com/aaageee/ltq-lms
  - Login dummy (dev mode) aktif di build Pages — 5 tombol login cepat tersedia
  - Deploy ulang: push ke `development` → workflow `Deploy ke GitHub Pages` jalan otomatis (~2 menit)
  - Pages Source wajib di-set **GitHub Actions** (sudah diaktifkan 1 Nov 2026)

## Keputusan Terbuka
<!-- Dari EVALUASI.md §4 -->
- ⚠️ Gaji/honor guru belum diputuskan (honor per sesi vs gaji tetap) — payroll MVP hanya untuk staf

## Lanjut Berikutnya
<!-- Isi modul + sub-prompt yang akan dikerjakan sesi berikutnya -->
- M2: Admin CRUD program, kelas, guru (backend + frontend, TanStack Query + toast)

## Catatan Pindah IDE
<!-- Catat jika ada hal khusus yang perlu diketahui IDE baru -->
- Baca `CONTEXT.md` di folder yang sama sebelum mulai kerja
