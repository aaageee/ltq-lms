# LTQ Markaz AlQuran LMS

Aplikasi LMS operasional untuk LTQ Markaz AlQuran — PSB, SPP & kwitansi, presensi/nilai guru, rekap kas & penggajian. Peserta **tidak punya akun**: semua komunikasi via WhatsApp otomatis (Fonnte).

## Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express.js + TypeScript + Prisma |
| Database | PostgreSQL 16 |
| Storage | folder lokal `backend/uploads/` (foto & KTP) |
| Cron | `node-cron` in-process |
| WA | Fonnte API (per-trigger, tanpa antrian) |
| Deploy | Docker Compose + Dokploy |

> Versi **Opsi Ringan** — tanpa MinIO, tanpa Redis/BullMQ. Lihat `../EVALUASI.md`.

## Struktur

```
/ltq-lms
  /frontend   → Next.js 16 App Router
  /backend    → Express.js + Prisma (src/routes, middleware, services, utils)
  /uploads    → (dibuat backend) foto & KTP peserta
  .env.example
  CONTEXT.md  → konteks project untuk AI sesi berikutnya
  PROGRESS.md → status modul build
```

## Menjalankan (lokal)

```bash
cp .env.example .env        # isi nilai secret

# backend
cd backend && npm install && npm run dev   # http://localhost:4000

# frontend
cd frontend && npm run dev                  # http://localhost:3000
```

Docker Compose (Postgres + backend + frontend) menyusul di modul **M0-B**.

## Dokumen

- `../PRD_LTQ_LEAN.md` — PRD final (9 modul aktif, M8 & M9 ditunda)
- `../PROMPTS_LTQ_PER_MODUL.md` — prompt per modul M0–M10
- `../EVALUASI.md` — hasil evaluasi & keputusan teknis

## Status Build

**Review UI (live):** https://aaageee.github.io/ltq-lms/ — login dummy (5 tombol login cepat), data dummy. Deploy otomatis via GitHub Actions setiap push ke `development`.

Lihat `PROGRESS.md`. Modul: M0 (setup) → M1 (auth) → M2 (admin) → M3 (PSB) → M4 (SPP) → M5–M6 (guru) → M7 (bendahara) → M10 (cron).
