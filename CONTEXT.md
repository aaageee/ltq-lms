# LTQ Markaz AlQuran LMS — Project Context

> Kasih file ini ke AI di awal setiap sesi baru, di IDE manapun.

## Stack
- Frontend : Next.js 16 App Router + TypeScript + Tailwind CSS + shadcn/ui (React 19, ESLint 9 flat config)
- Backend  : Express.js + TypeScript + Prisma ORM
- Database : PostgreSQL 16
- Storage  : folder lokal `/backend/uploads` (foto & KTP peserta) — **bukan MinIO**
- Cron     : `node-cron` in-process (job harian) — **tanpa Redis/BullMQ**
- WA       : Fonnte API, per-trigger langsung (tanpa antrian) — nomor resmi lembaga
- Deploy   : Docker Compose (postgres + backend + frontend) + Dokploy di VPS

> ⚠️ **Opsi Ringan (31 Okt 2026):** MinIO & Redis/BullMQ dibuang demi MVP. Jangan tambahkan service infra lagi tanpa keputusan eksplisit.

## Struktur Folder
```
/ltq-lms
  /frontend        → Next.js 16
  /backend         → Express.js + Prisma (+ folder /uploads)
  /docker-compose.yml
  /CONTEXT.md      ← file ini
  /PROGRESS.md     ← status progress terbaru
```

## Dokumen Proyek (folder induk)
- `PRD_LTQ_LEAN.md` — PRD final versi Opsi Ringan (9 modul aktif)
- `PROMPTS_LTQ_PER_MODUL.md` — prompt per modul M0–M10 (M8 & M9 ditunda ⏸️)
- `EVALUASI.md` — hasil evaluasi, keputusan, dan addendum

## Role User (tidak ada akun peserta)
- SUPER_ADMIN  → cukup akun seeder (MVP: modul CRUD ditunda)
- ADMIN_CABANG → program, kelas, guru, konfigurasi
- GURU         → presensi, nilai, raport, cuti
- TU           → PSB, SPP, kwitansi, daftar ulang (manual)
- BENDAHARA    → kas, penggajian, laporan

## Peserta
Tidak punya akun. Semua komunikasi via WhatsApp otomatis (Fonnte API).
Sanitasi nomor WA wajib: `08xx` / `8xx` / `+62xx` → `62xx`

## Modul
- **Aktif (MVP):** M0, M1, M2, M3, M4, M5, M6, M7, M10 → ≈9–11 sesi AG
- **Ditunda (post-MVP):** M8 (Daftar Ulang blast), M9 (Super Admin CRUD)

## Konvensi Penting
- Prisma schema  : `/backend/prisma/schema.prisma`
- Env variables  : `/.env.example`
- Seeder         : `cd backend && npx ts-node prisma/seed.ts` (5 akun + 1 cabang)
- Jalankan lokal : `docker compose up -d && cd frontend && npm run dev`
- Period format  : `YYYY-MM` (SPP), `YYYY-Sn` (raport/DU)
- Commit format  : `feat(M[N]-[X]): deskripsi singkat`
- Branch kerja   : `development` → merge ke `main` untuk deploy
- Password       : min 8 karakter + angka (NFR) — akun default wajib diganti sebelum deploy
