import { prisma } from "../lib/prisma";
import { sanitizeWA } from "../utils/sanitizeWA";

// ─────────────────────────────────────────────────────────────
// Template WA — DISALIN PERSIS dari PRD §15 (sumber kebenaran).
// JANGAN ubah teks, emoji, atau spasi tanpa persetujuan Admin LTQ.
// ─────────────────────────────────────────────────────────────

// WA #1 — Konfirmasi Pendaftaran
export function waKonfirmasiDaftar(vars: {
  nama: string;
  program: string;
  kelas: string;
  jadwal: string;
  noid: string;
  nominal: string;
  rekening_bank: string;
  nama_lembaga: string;
}): string {
  return `Assalamualaikum *${vars.nama}* 👋

Alhamdulillah, pendaftaran Anda di LTQ Markaz AlQuran telah berhasil dicatat.

📚 Program  : ${vars.program}
🏫 Kelas    : ${vars.kelas}
🗓️ Jadwal   : ${vars.jadwal}
🆔 No. ID   : ${vars.noid}

Silakan lakukan pembayaran awal:
💰 Total    : Rp ${vars.nominal}
🏦 Rekening : ${vars.rekening_bank}
               a.n ${vars.nama_lembaga}

Setelah transfer, informasikan ke TU lembaga untuk konfirmasi.
Jazakallahu khairan! 🌟`;
}

// WA #2 — Konfirmasi Pembayaran SPP
export function waKonfirmasiBayar(vars: {
  nama: string;
  periode: string;
  nominal: string;
}): string {
  return `Alhamdulillah *${vars.nama}* 🎉

Pembayaran SPP Anda telah dikonfirmasi.

📅 Periode  : ${vars.periode}
💰 Nominal  : Rp ${vars.nominal}
✅ Status   : Lunas

Kwitansi dapat diminta ke TU lembaga.
Semoga ilmunya bermanfaat! 📖`;
}

// WA #3 — Reminder Tagihan
export function waReminderTagihan(vars: {
  nama: string;
  nominal: string;
  jatuh_tempo: string;
  rekening_bank: string;
  nama_lembaga: string;
}): string {
  return `Assalamualaikum *${vars.nama}*,

📋 Reminder tagihan SPP:
💰 Nominal      : Rp ${vars.nominal}
📅 Jatuh tempo  : ${vars.jatuh_tempo}

Silakan transfer ke:
🏦 ${vars.rekening_bank}
   a.n ${vars.nama_lembaga}

Balas pesan ini setelah transfer untuk konfirmasi.
Terima kasih! 🙏`;
}

// WA #4 — Notifikasi Daftar Ulang (dipakai manual; blast di M8 post-MVP)
export function waDaftarUlang(vars: {
  nama: string;
  semester: string;
  deadline: string;
  nominal_du: string;
}): string {
  return `Assalamualaikum *${vars.nama}*,

📢 *Daftar Ulang Semester ${vars.semester}*

Masa daftar ulang telah dibuka. Segera hubungi TU lembaga untuk proses DU.

⏰ Deadline : ${vars.deadline}
💰 Biaya DU : Rp ${vars.nominal_du}

Peserta yang tidak melakukan DU sebelum deadline akan dinonaktifkan.

Jazakallahu khairan! 🌟`;
}

// WA #5 — Kenaikan Level
export function waKenaikanLevel(vars: {
  nama: string;
  level_baru: string;
  program: string;
}): string {
  return `Masya Allah *${vars.nama}* ⭐

Selamat! Berdasarkan penilaian pengajar, Anda telah resmi dinaikkan ke:

📈 Level Baru : *${vars.level_baru}*
📚 Program    : ${vars.program}

Ini adalah buah dari kesungguhan belajar Anda.
Teruslah semangat mendalami ilmu Al-Quran! 📖✨`;
}

// ─────────────────────────────────────────────────────────────
// Pengiriman via Fonnte API
// Jika gagal (atau token belum diisi) → log 'failed', TIDAK throw
// agar alur bisnis utama tidak terganggu.
// ─────────────────────────────────────────────────────────────
export async function sendWA(
  nomor: string,
  pesan: string,
  triggerType: string
): Promise<void> {
  const target = sanitizeWA(nomor);
  const token = process.env.FONNTE_TOKEN;
  let status: "sent" | "failed" = "failed";

  if (token) {
    try {
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: token },
        body: new URLSearchParams({
          target,
          message: pesan,
          countryCode: "62",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { status?: boolean; reason?: string };
      status = res.ok && json.status !== false ? "sent" : "failed";
      if (status === "failed") {
        console.error("[wa] Fonnte gagal:", json.reason ?? res.status);
      }
    } catch (err) {
      console.error("[wa] error kirim Fonnte:", err);
    }
  } else {
    console.warn("[wa] FONNTE_TOKEN belum di-set — pesan tidak terkirim (dicatat sebagai failed).");
  }

  try {
    await prisma.waLog.create({
      data: { recipient: target, message: pesan, triggerType, status },
    });
  } catch (err) {
    console.error("[wa] gagal mencatat log:", err);
  }
}

// Kirim tanpa memblokir response (fire and forget)
export function sendWABackground(nomor: string, pesan: string, triggerType: string): void {
  void sendWA(nomor, pesan, triggerType);
}
