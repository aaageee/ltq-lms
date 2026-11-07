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
- [x] M2   — Admin: CRUD program, kelas, guru
- [x] M3-A — Backend PSB: input peserta, NoID, assign kelas, upload ke /uploads
- [x] M3-B — Frontend PSB: form multi-step + halaman detail peserta
- [x] M4-A — Backend SPP: invoice, konfirmasi bayar (TU|BENDAHARA), kwitansi PDF
- [x] M4-B — Frontend SPP: buat invoice, konfirmasi, download kwitansi
- [x] M4-C — Integrasi Fonnte WA (template persis PRD §15, trigger #1–#3, #5) — ⏸️ token Fonnte belum ada
- [x] M5   — Guru: presensi + nilai (1 transaksi) + cuti badal
- [ ] M6   — Guru: raport PDF + kenaikan level + approval admin + WA #5
- [ ] M7-A — Backend bendahara: kas (SPP derive dari payments), penggajian, export
- [ ] M7-B — Frontend bendahara: dashboard kas + penggajian
- [ ] M10  — Scheduled job harian node-cron (overdue invoice + backup DB)

### Ditunda (post-MVP)
- ⏸️ M8   — Daftar ulang semester + WA blast (MVP: TU proses manual via invoice)
- ⏸️ M9   — Super Admin CRUD cabang/akun admin (MVP: akun dari seeder)

## Catatan Per Modul
<!-- Isi setelah tiap modul selesai -->
### M5
- Status: ✅ selesai (8 Nov 2026)
- Backend `/api/guru` (GURU): jadwal-hari-ini (cocokkan `scheduleDays` dengan hari), daftar kelas, siswa per kelas + status presensi hari ini, rekap presensi bulanan, pengajuan cuti + daftar cuti, daftar guru lain (badal)
- `POST /api/attendances/sesi`: presensi + nilai **satu transaksi**; validasi 1 kelas 1 sesi/hari, ownership (guru kelas atau badal yang ditugaskan), nilai <60 wajib catatan, siswa harus terdaftar aktif
- Frontend: dashboard guru (jadwal real + tombol Mulai Sesi/Sesi Selesai), halaman presensi (`?class=`), rekap matriks bulanan, form cuti + riwayat
- ✅ Uji: 10 skenario curl backend + browser (simpan sesi → "sudah diisi", rekap tampil, cuti tersimpan)
- ⚠️ Perbaikan penting: query dengan flag `enabled` yang berubah setelah mount membuat fetch menggantung di React 19 + TanStack Query v5 — dihapus; komponen sekarang mount dengan id yang sudah pasti
- Seeder: `guru@ltq.id` sekarang punya profil guru (Ust. Abdul Karim); 2 kelas dijadwalkan hari Minggu untuk demo

### M3-B
- Status: ✅ selesai (8 Nov 2026)
- Halaman `/dashboard/tu/peserta`: tabel peserta + filter status/program + pencarian (debounce), badge status
- Drawer form **multi-step 3 langkah**: biodata (+ dropzone foto/KTP dengan preview) → program & kelas (sisa kuota, kelas penuh/tanpa guru disabled) → konfirmasi + ringkasan
- Setelah simpan: dialog sukses menampilkan **NoID** + tombol lihat detail
- Halaman detail `/dashboard/tu/peserta/detail?id=…`: kartu biodata + foto, tab **Riwayat Bayar / Presensi / Nilai**, aksi Edit Biodata, Cuti, Nonaktifkan
- ⚠️ Detail memakai query param `?id=` (bukan route dinamis) karena `output: export` tidak mendukung dynamic segment tanpa `generateStaticParams`; `useSearchParams` diganti pembacaan URL langsung agar tidak menggantung di static export
- Foto peserta di mode API asli diambil lewat endpoint ber-token → blob URL (bukan `<img src>` langsung)
- Mock diperluas: 8 peserta + invoice/presensi/nilai demo agar preview GitHub Pages tetap hidup

### M4-A
- Status: ✅ selesai (8 Nov 2026)
- Endpoint `/api/invoices` (TU & BENDAHARA): list + filter status/periode/nama, `/tunggakan` (unpaid/overdue + `daysOverdue`), POST buat invoice (periode wajib `YYYY-MM`, duplikat 409), konfirmasi bayar (nominal **wajib sama** dengan total), batalkan (alasan wajib), **kwitansi PDF** (pdfkit), kirim reminder WA #3
- `services/invoiceService.ts` memisahkan business logic dari route
- `services/whatsapp.ts`: template WA #1–#5 **verbatim PRD §15** + `sendWA` Fonnte (non-blocking, gagal → log `failed`, tidak throw)
- ✅ Uji: create/duplikat/format periode, list, tunggakan, tolak nominal parsial, konfirmasi, PDF valid (2.2 KB, 1 halaman), reminder, batal, RBAC (guru 403, bendahara boleh)
- ⚠️ Bukti transfer (`proof_url`) belum ada endpoint upload — field tersedia di API, upload file menyusul

### M4-B
- Status: ✅ selesai (8 Nov 2026)
- Halaman `/dashboard/tu/spp` 3 tab:
  - **Buat Invoice**: cari peserta, periode (month picker), komponen biaya dinamis (tambah/hapus baris), preview total
  - **Daftar Invoice**: filter status/periode/cari, warna baris (merah terlambat, kuning jatuh tempo ≤3 hari), aksi Bayar (dialog nominal+metode), Reminder (preview teks WA #3 sebelum kirim), Batalkan (alasan), Download Kwitansi
  - **Tunggakan**: daftar tunggakan + checkbox + kirim reminder massal
- Mock mode: invoice seed 5 baris (lunas/belum/terlambat), konfirmasi & pembatalan berfungsi; PDF hanya di mode API (mock menampilkan info)
- ✅ Uji browser: daftar tampil, dialog bayar prefill nominal, konfirmasi → status Lunas

### M4-C
- Status: ✅ selesai kode (8 Nov 2026) — ⏸️ **butuh token Fonnte untuk uji kirim nyata**
- `services/whatsapp.ts`: `sanitizeWA`, `sendWA` (POST api.fonnte.com/send, header Bearer token, body target/message/countryCode), template #1–#5 verbatim PRD
- Trigger terpasang: WA #1 (daftar peserta), WA #2 (konfirmasi bayar), WA #3 (reminder) — dikirim background setelah transaksi sukses
- WA #4 & #5 tersedia sebagai fungsi (dipakai M6 / M8)
- Tanpa `FONNTE_TOKEN`: pesan **tidak dikirim** dan dicatat `status=failed` di `WaLog` (tidak menggagalkan alur bisnis)
- ⏸️ **PERLU OTORISASI**: isi `FONNTE_TOKEN` + `FONNTE_DEVICE_ID` di `backend/.env` (dan secret deploy) untuk aktivasi pengiriman

### M3-A
- Status: ✅ selesai (1 Nov 2026)
- **Endpoint** (`/api/students`, role TU saja):
  - `GET /` — list + filter `status` / `programId` / `classId` / `search` (nama, NoID, WA); response: noid, nama, wa, program, kelas, nama_guru, status
  - `GET /:id` — detail: biodata + enrollments (program/kelas/jadwal/guru) + invoice & pembayaran + 10 presensi terakhir + 10 nilai terakhir
  - `POST /` — daftar peserta baru; body terima snake_case (`program_id`, `class_id`, `parent_name`) maupun camelCase
  - `PUT /:id` — update biodata (WA ikut disanitasi)
  - `POST /:id/upload-foto` (JPG/PNG) & `/:id/upload-ktp` (JPG/PNG/PDF), maks 2MB → file di `backend/uploads/`
  - `GET /:id/foto` & `/:id/ktp` — **wajib token** (tanpa token 401); file tidak disajikan sebagai static publik
  - `POST /:id/nonaktifkan` (status inactive + deletedAt), `POST /:id/cuti` (cuti + rentang tanggal + alasan)
  - `POST /:id/daftar-ulang` — buat invoice periode semester (`YYYY-Sn`), tolak duplikat 409
- **Validasi bisnis** saat daftar: kelas aktif & milik cabang, program harus cocok dengan kelas, **kelas wajib punya guru**, **kuota** (`filled < capacity`, penolakan menyertakan `sisaKuota`), WA valid
- **NoID**: `LTQ-[KODE]-[TAHUN]-[NNN]` via `utils/generateNoID.ts`, dijalankan dalam transaksi `Serializable` (anti nomor bentrok)
- **WA #1**: template PRD §15 verbatim (`services/wa.ts`) dicatat ke `WaLog` (pengiriman Fonnte di M4-C)
- Utils: `sanitizeWA.ts` (menggantikan `whatsapp.ts` agar satu sumber), `generateNoID.ts`
- Seeder: +8 peserta demo (6 aktif, 1 cuti, 1 nonaktif) untuk uji filter
- ✅ Verifikasi: 22 skenario curl — NoID urut 001→002, sanitasi WA (`+62…`, `0812-…`), tolak kelas tanpa guru, tolak program tidak cocok, tolak kelas penuh + sisaKuota, upload/akses file ber-token, tipe file salah ditolak, cuti/nonaktif, daftar ulang + duplikat, RBAC 403 untuk admin
- ⚠️ Catatan: `{nominal}` pada WA #1 masih `0` (biaya awal belum ada di konfigurasi; akan terisi saat M4-A). Aturan "maks 2 program" & "1 kelas per program" belum terpakai karena endpoint belum bisa menambah enrollment kedua (menyusul saat fitur multi-program).

### M2
- Status: ✅ selesai (1 Nov 2026)
- **Backend** (`/api/programs`, `/api/classes`, `/api/teachers`): CRUD lengkap, semua dilindungi `verifyToken` + `requireRole(["ADMIN_CABANG"])`
  - Program: list semua (aktif+nonaktif) + `_count.classes`; POST/PUT; DELETE = soft delete (`isActive=false`)
  - Kelas: list + program + guru + jumlah peserta aktif; POST/PUT (assign/ganti guru); DELETE soft delete; validasi program & guru milik cabang
  - Guru: POST otomatis buat akun `User` role GURU (password `ltq@2026`, bcrypt 12) dalam 1 transaksi; DELETE menonaktifkan akun + set `deletedAt`
  - Sanitasi WA (`0812…`/`812…`/`+62…` → `62…`) di `utils/whatsapp.ts` — dipakai ulang di M3
  - Validasi Zod + `asyncHandler` + error handler global di `index.ts`
- **Frontend**: halaman `/dashboard/admin/{program,kelas,guru}` — tabel, modal tambah/edit, dialog konfirmasi, toast (sonner), badge kuota (hijau sisa / merah penuh), badge "Belum ada guru"
- TanStack Query: `usePrograms/useClasses/useTeachers` + mutation hooks, invalidasi cache otomatis
- **Mode preview tetap hidup**: `lib/api.ts` + `lib/mock-db.ts` — jika `NEXT_PUBLIC_DEV_MODE=true` semua CRUD jalan di memori (GitHub Pages), data reset saat reload; jika `false` hit API asli
- Seeder diperluas: 3 program (Tahsin/Tartil/Talaqqi), 4 guru, 6 kelas demo (termasuk 1 kelas tanpa guru)
- ✅ Verifikasi: 12 skenario curl backend lolos; UI CRUD diuji di mock; CRUD nyata diuji ke PostgreSQL (program "Bahasa Arab" tersimpan)
- Catatan kecil: di mode API asli, nama user di topbar = prefix email (belum ada data nama profil / endpoint profil)

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
- M6: Raport PDF + kenaikan level + approval admin + WA #5

## Catatan Pindah IDE
<!-- Catat jika ada hal khusus yang perlu diketahui IDE baru -->
- Baca `CONTEXT.md` di folder yang sama sebelum mulai kerja
