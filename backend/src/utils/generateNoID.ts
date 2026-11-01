import type { Prisma } from "@prisma/client";

// Generate NoID peserta: LTQ-[KODE_CABANG]-[TAHUN]-[3DIGIT]
// Contoh: LTQ-JKT-2026-001
// Wajib dipanggil di dalam transaksi (serializable) agar nomor tidak bentrok.
export async function generateNoID(
  tx: Prisma.TransactionClient,
  branchId: number,
  year: number = new Date().getFullYear()
): Promise<string> {
  const branch = await tx.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error("Cabang tidak ditemukan");

  const prefix = `LTQ-${branch.code}-${year}-`;

  // NoID terakhir tahun ini untuk cabang tersebut (urut menurun)
  const last = await tx.student.findFirst({
    where: { noid: { startsWith: prefix } },
    orderBy: { noid: "desc" },
    select: { noid: true },
  });

  const lastSeq = last ? Number.parseInt(last.noid.slice(prefix.length), 10) : 0;
  const nextSeq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
