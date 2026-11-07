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

  // 3. Data master demo (M2): program, guru, kelas — untuk pengembangan lokal
  const programSeeds = [
    { name: "Tahsin", capacity: 15 },
    { name: "Tartil", capacity: 12 },
    { name: "Talaqqi", capacity: 10 },
  ];

  const programs: Record<string, number> = {};
  for (const p of programSeeds) {
    const existing = await prisma.program.findFirst({ where: { branchId: branch.id, name: p.name } });
    const program =
      existing ??
      (await prisma.program.create({ data: { branchId: branch.id, name: p.name } }));
    programs[p.name] = program.id;
  }
  console.log(`[seed] program: ${Object.keys(programs).join(", ")}`);

  const teacherSeeds = [
    { name: "Ust. Abdul Karim", whatsapp: "6281234567890", specialization: "Tahsin", email: "guru@ltq.id" },
    { name: "Ust. Ibrahim", whatsapp: "6281298765432", specialization: "Tartil", email: "ibrahim@ltq.id" },
    { name: "Ust. Hamzah", whatsapp: "6281355566677", specialization: "Talaqqi", email: "hamzah@ltq.id" },
    { name: "Ustazah Aisyah", whatsapp: "6285711122233", specialization: "Tahsin & Tartil", email: "aisyah@ltq.id" },
  ];

  const teachers: Record<string, number> = {};
  for (const t of teacherSeeds) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash,
        role: "GURU",
        branchId: branch.id,
      },
    });
    const existing = await prisma.teacher.findUnique({ where: { userId: user.id } });
    const teacher =
      existing ??
      (await prisma.teacher.create({
        data: {
          userId: user.id,
          name: t.name,
          whatsapp: t.whatsapp,
          specialization: t.specialization,
        },
      }));
    teachers[t.name] = teacher.id;
  }
  console.log(`[seed] guru: ${Object.keys(teachers).join(", ")}`);

  const classSeeds = [
    { name: "Kelas Tahsin A", program: "Tahsin", teacher: "Ust. Abdul Karim", days: "Senin,Rabu,Minggu", time: "09:00-10:00", room: "Ruang 1" },
    { name: "Kelas Tahsin B", program: "Tahsin", teacher: "Ust. Abdul Karim", days: "Selasa,Kamis", time: "14:00-15:00", room: "Ruang 2" },
    { name: "Kelas Tartil A", program: "Tartil", teacher: "Ust. Ibrahim", days: "Senin,Kamis,Minggu", time: "10:00-11:00", room: "Ruang 3" },
    { name: "Kelas Tartil B", program: "Tartil", teacher: "Ust. Ibrahim", days: "Selasa,Jumat", time: "14:00-15:00", room: "Ruang 3" },
    { name: "Kelas Talaqqi A", program: "Talaqqi", teacher: "Ust. Hamzah", days: "Rabu", time: "13:00-14:30", room: "Ruang 4" },
    { name: "Kelas Tahsin C", program: "Tahsin", teacher: null, days: "Sabtu", time: "08:00-09:00", room: "Ruang 1" },
  ];

  for (const c of classSeeds) {
    const existing = await prisma.class.findFirst({ where: { branchId: branch.id, name: c.name } });
    if (!existing) {
      await prisma.class.create({
        data: {
          branchId: branch.id,
          programId: programs[c.program],
          teacherId: c.teacher ? teachers[c.teacher] : null,
          name: c.name,
          capacity: programSeeds.find((p) => p.name === c.program)?.capacity ?? 15,
          scheduleDays: c.days,
          scheduleTime: c.time,
          room: c.room,
        },
      });
    }
  }
  console.log(`[seed] kelas: ${classSeeds.length} baris (demo)`);

  // 4. Peserta demo (M3) — beragam status untuk uji filter
  const classIdByName: Record<string, number> = {};
  for (const c of classSeeds) {
    const row = await prisma.class.findFirst({ where: { branchId: branch.id, name: c.name } });
    if (row) classIdByName[c.name] = row.id;
  }

  const studentSeeds = [
    { name: "Muhammad Rizky", wa: "6281234567890", kelas: "Kelas Tahsin A", program: "Tahsin", status: "active" as const },
    { name: "Aisyah Putri", wa: "6281234567891", kelas: "Kelas Tartil A", program: "Tartil", status: "active" as const },
    { name: "Abdurrahman Hakim", wa: "6281234567892", kelas: "Kelas Talaqqi A", program: "Talaqqi", status: "active" as const },
    { name: "Fatimah Az-Zahra", wa: "6281234567893", kelas: "Kelas Tahsin A", program: "Tahsin", status: "active" as const },
    { name: "Yusuf Al-Amin", wa: "6281234567894", kelas: "Kelas Tartil A", program: "Tartil", status: "active" as const },
    { name: "Khadijah Nur", wa: "6281234567895", kelas: "Kelas Tahsin B", program: "Tahsin", status: "cuti" as const },
    { name: "Ibrahim Sulaiman", wa: "6281234567896", kelas: "Kelas Tartil B", program: "Tartil", status: "active" as const },
    { name: "Ruqayyah Hanin", wa: "6281234567897", kelas: "Kelas Tahsin B", program: "Tahsin", status: "inactive" as const },
  ];

  let seq = 0;
  for (const s of studentSeeds) {
    seq += 1;
    const noid = `LTQ-${branch.code}-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`;
    const existing = await prisma.student.findUnique({ where: { noid } });
    if (existing) continue;

    const student = await prisma.student.create({
      data: {
        branchId: branch.id,
        noid,
        name: s.name,
        whatsapp: s.wa,
        gender: seq % 2 === 0 ? "P" : "L",
        status: s.status,
        ...(s.status === "cuti"
          ? { cutiStart: new Date("2026-11-10"), cutiEnd: new Date("2026-11-20"), cutiReason: "Sakit" }
          : {}),
        ...(s.status === "inactive" ? { deletedAt: new Date() } : {}),
      },
    });

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: classIdByName[s.kelas],
        programId: programs[s.program],
        status: s.status === "inactive" ? "dropped" : "active",
      },
    });
  }
  console.log(`[seed] peserta: ${studentSeeds.length} baris (demo)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
