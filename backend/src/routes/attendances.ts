import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(verifyToken, requireRole(["GURU"]));

const sesiSchema = z.object({
  classId: z.coerce.number().int().positive(),
  sessionDate: z.string().trim().optional(),
  teacherStatus: z.enum(["hadir", "badal"]).default("hadir"),
  badalTeacherId: z.coerce.number().int().positive().nullable().optional(),
  siswaPresensi: z
    .array(
      z.object({
        studentId: z.coerce.number().int().positive(),
        status: z.enum(["hadir", "absen", "izin", "sakit"]),
        score: z.coerce.number().min(0).max(100).nullable().optional(),
        notes: z.string().trim().max(500).nullable().optional(),
      })
    )
    .min(1, "Presensi siswa wajib diisi"),
});

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// POST /api/attendances/sesi → presensi + nilai dalam SATU transaksi
router.post(
  "/sesi",
  asyncHandler(async (req: Request, res: Response) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.sub } });
    if (!teacher || !teacher.isActive) {
      res.status(403).json({ message: "Profil guru tidak ditemukan atau nonaktif." });
      return;
    }

    const parsed = sesiSchema.safeParse({
      classId: req.body?.classId ?? req.body?.class_id,
      sessionDate: req.body?.sessionDate ?? req.body?.session_date,
      teacherStatus: req.body?.teacherStatus ?? req.body?.teacher_status ?? "hadir",
      badalTeacherId: req.body?.badalTeacherId ?? req.body?.badal_teacher_id ?? null,
      siswaPresensi: (req.body?.siswaPresensi ?? req.body?.siswa_presensi ?? []).map(
        (s: Record<string, unknown>) => ({
          studentId: s.studentId ?? s.student_id,
          status: s.status,
          score: s.score ?? null,
          notes: s.notes ?? null,
        })
      ),
    });

    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const sessionDate = startOfDay(d.sessionDate ? new Date(d.sessionDate) : new Date());
    if (Number.isNaN(sessionDate.getTime())) {
      res.status(400).json({ message: "Tanggal sesi tidak valid." });
      return;
    }

    // Ownership
    const cls = await prisma.class.findUnique({ where: { id: d.classId } });
    if (!cls) {
      res.status(404).json({ message: "Kelas tidak ditemukan." });
      return;
    }

    if (d.teacherStatus === "badal") {
      if (!d.badalTeacherId || d.badalTeacherId !== teacher.id) {
        res.status(403).json({
          message: "Hanya guru badal yang ditugaskan pada sesi ini yang boleh mengisi.",
        });
        return;
      }
    } else if (cls.teacherId !== teacher.id) {
      res.status(403).json({ message: "Anda bukan guru pengajar kelas ini." });
      return;
    }

    // 1 kelas hanya boleh 1 sesi per hari
    const endOfDay = new Date(sessionDate);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const existing = await prisma.attendance.findFirst({
      where: { classId: d.classId, sessionDate: { gte: sessionDate, lt: endOfDay } },
      select: { id: true },
    });
    if (existing) {
      res.status(409).json({ message: "Presensi kelas ini untuk tanggal tersebut sudah diisi." });
      return;
    }

    // Validasi nilai < 60 wajib catatan
    for (const s of d.siswaPresensi) {
      if (s.score !== null && s.score !== undefined && s.score < 60 && !s.notes?.trim()) {
        res.status(400).json({
          message: "Nilai di bawah 60 wajib disertai catatan guru.",
          studentId: s.studentId,
        });
        return;
      }
    }

    // Pastikan siswa memang terdaftar di kelas
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: d.classId, status: "active" },
      select: { studentId: true },
    });
    const enrolled = new Set(enrollments.map((e) => e.studentId));
    const notEnrolled = d.siswaPresensi.filter((s) => !enrolled.has(s.studentId));
    if (notEnrolled.length > 0) {
      res.status(400).json({
        message: "Ada siswa yang tidak terdaftar aktif di kelas ini.",
        studentIds: notEnrolled.map((s) => s.studentId),
      });
      return;
    }

    // Simpan presensi + nilai dalam satu transaksi
    const result = await prisma.$transaction(async (tx) => {
      const attendances = await tx.attendance.createMany({
        data: d.siswaPresensi.map((s) => ({
          classId: d.classId,
          studentId: s.studentId,
          teacherId: cls.teacherId ?? teacher.id,
          sessionDate,
          studentStatus: s.status,
          teacherStatus: d.teacherStatus,
          badalTeacherId: d.teacherStatus === "badal" ? teacher.id : null,
        })),
      });

      const gradesData = d.siswaPresensi
        .filter((s) => s.score !== null && s.score !== undefined)
        .map((s) => ({
          studentId: s.studentId,
          classId: d.classId,
          teacherId: teacher.id,
          gradeType: "harian" as const,
          score: s.score as number,
          notes: s.notes ?? null,
        }));

      if (gradesData.length > 0) {
        await tx.grade.createMany({ data: gradesData });
      }

      return { attendances: attendances.count, grades: gradesData.length };
    });

    res.status(201).json({
      message: `Sesi tersimpan: ${result.attendances} presensi, ${result.grades} nilai.`,
      ...result,
      sessionDate: sessionDate.toISOString(),
    });
  })
);

export default router;
