// Seeder M1-A: 1 cabang + 5 akun default
// Jalankan: cd backend && npx prisma db seed
// ⚠️ Password semua akun: admin123 — WAJIB diganti sebelum deploy (NFR)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Cabang pertama
  const branch = await prisma.branch.upsert({
    where: { code: "JKT" },
    update: {},
    create: {
      code: "JKT",
      name: "LTQ Markaz AlQuran",
      address: "Jakarta",
    },
  });
  console.log(`[seed] cabang: ${branch.name} (${branch.code})`);

  // 2. 5 akun default — password admin123 (8 karakter + angka, sesuai NFR)
  const passwordHash = await bcrypt.hash("admin123", 12);

  const accounts: Array<{ email: string; role: "SUPER_ADMIN" | "ADMIN_CABANG" | "GURU" | "TU" | "BENDAHARA"; branchId: number | null }> = [
    { email: "superadmin@ltq.id", role: "SUPER_ADMIN", branchId: null },
    { email: "admin@ltq.id", role: "ADMIN_CABANG", branchId: branch.id },
    { email: "guru@ltq.id", role: "GURU", branchId: branch.id },
    { email: "tu@ltq.id", role: "TU", branchId: branch.id },
    { email: "bendahara@ltq.id", role: "BENDAHARA", branchId: branch.id },
  ];

  for (const acc of accounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: { role: acc.role, branchId: acc.branchId },
      create: {
        email: acc.email,
        passwordHash,
        role: acc.role,
        branchId: acc.branchId,
      },
    });
    console.log(`[seed] akun: ${acc.email} → ${acc.role}`);
  }

  console.log("[seed] selesai. ⚠️ Ganti password default sebelum deploy!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
