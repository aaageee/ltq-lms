import { prisma } from "../lib/prisma";

// Template WA #1 — Konfirmasi Pendaftaran (PRD §15, sumber kebenaran)
// PENTING: jangan ubah teks tanpa persetujuan Admin LTQ.
export function buildWaPendaftaran(vars: {
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

// Catat log WA. Pengiriman aktual (Fonnte) dipasang di M4-C.
export async function logWa(params: {
  recipient: string;
  message: string;
  triggerType: string;
  status?: "sent" | "failed";
}): Promise<void> {
  try {
    await prisma.waLog.create({
      data: {
        recipient: params.recipient,
        message: params.message,
        triggerType: params.triggerType,
        status: params.status ?? "sent",
      },
    });
  } catch (err) {
    // log WA tidak boleh menggagalkan transaksi bisnis
    console.error("[wa] gagal mencatat log:", err);
  }
}
