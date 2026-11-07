import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Modul KBM: hanya GURU
router.use(verifyToken, requireRole(["GURU"]));

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function myTeacher(req: Request) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.sub } });
  if (!teacher || !teacher.isActive) {
    throw new HttpError(403, "Profil guru tidak ditemukan atau nonaktif untuk akun ini.");
  }
  return teacher;
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

// GET /api/guru/jadwal-hari-ini
router.get(
  "/jadwal-hari-ini",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const teacher = await myTeacher(req);
      const today = DAY_NAMES[new Date().getDay()];
      const { start, end } = dayRange(new Date());

      const classes = await prisma.class.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          program: { select: { id: true, name: true } },
          _count: { select: { enrollments: { where: { status: "active" } } } },
        },
        orderBy: { scheduleTime: "asc" },
      });

      const todays = classes.filter((c) =>
        c.scheduleDays
          .split(",")
          .map((d) => d.trim().toLowerCase())
          .includes(today.toLowerCase())
      );

      const withSession = await Promise.all(
        todays.map(async (c) => {
          const session = await prisma.attendance.findFirst({
            where: { classId: c.id, sessionDate: { gte: start, lt: end } },
            select: { id: true },
          });
          return {
            id: c.id,
            name: c.name,
            program: c.program.name,
            scheduleDays: c.scheduleDays,
            scheduleTime: c.scheduleTime,
            room: c.room,
            students: c._count.enrollments,
            hasSession: !!session,
          };
        })
      );

      res.json({ hari: today, kelas: withSession });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

// GET /api/guru/kelas → daftar kelas yang diajar guru ini
router.get(
  "/kelas",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const teacher = await myTeacher(req);
      const classes = await prisma.class.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          program: { select: { name: true } },
          _count: { select: { enrollments: { where: { status: "active" } } } },
        },
        orderBy: { name: "asc" },
      });
      res.json({
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          program: c.program.name,
          scheduleDays: c.scheduleDays,
          scheduleTime: c.scheduleTime,
          room: c.room,
          students: c._count.enrollments,
        })),
      });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

// GET /api/guru/kelas/:class_id/siswa → siswa + status presensi hari ini
router.get(
  "/kelas/:classId/siswa",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const teacher = await myTeacher(req);
      const classId = Number(req.params.classId);
      const { start, end } = dayRange(new Date());

      const cls = await prisma.class.findFirst({
        where: { id: classId, teacherId: teacher.id, isActive: true },
        include: { program: { select: { name: true } } },
      });
      if (!cls) {
        res.status(404).json({ message: "Kelas tidak ditemukan atau bukan kelas Anda." });
        return;
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { classId, status: "active" },
        include: { student: { select: { id: true, noid: true, name: true } } },
        orderBy: { student: { name: "asc" } },
      });

      const attendances = await prisma.attendance.findMany({
        where: { classId, sessionDate: { gte: start, lt: end } },
      });
      const attMap = new Map(attendances.map((a) => [a.studentId, a]));

      const students = enrollments.map((e) => {
        const att = attMap.get(e.student.id);
        return {
          id: e.student.id,
          noid: e.student.noid,
          name: e.student.name,
          status: att?.studentStatus ?? null,
        };
      });

      res.json({
        class: {
          id: cls.id,
          name: cls.name,
          program: cls.program.name,
          scheduleDays: cls.scheduleDays,
          scheduleTime: cls.scheduleTime,
          room: cls.room,
        },
        sessionFilled: attendances.length > 0,
        students,
      });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

// GET /api/guru/rekap-presensi/:class_id?month=YYYY-MM
router.get(
  "/rekap-presensi/:classId",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const teacher = await myTeacher(req);
      const classId = Number(req.params.classId);
      const month = String(req.query.month ?? "").trim();

      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        res.status(400).json({ message: 'Parameter month wajib format "YYYY-MM".' });
        return;
      }

      const cls = await prisma.class.findFirst({
        where: { id: classId, teacherId: teacher.id },
        include: { program: { select: { name: true } } },
      });
      if (!cls) {
        res.status(404).json({ message: "Kelas tidak ditemukan atau bukan kelas Anda." });
        return;
      }

      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);

      const attendances = await prisma.attendance.findMany({
        where: { classId, sessionDate: { gte: start, lt: end } },
        include: { student: { select: { id: true, noid: true, name: true } } },
        orderBy: { sessionDate: "asc" },
      });

      const sessionDates = Array.from(
        new Set(attendances.map((a) => new Date(a.sessionDate).toISOString().slice(0, 10)))
      ).sort();

      const studentMap = new Map<number, { id: number; noid: string; name: string; statuses: Record<string, string> }>();
      for (const a of attendances) {
        const key = a.student.id;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: a.student.id,
            noid: a.student.noid,
            name: a.student.name,
            statuses: {},
          });
        }
        studentMap.get(key)!.statuses[new Date(a.sessionDate).toISOString().slice(0, 10)] = a.studentStatus;
      }

      const students = Array.from(studentMap.values()).map((s) => {
        const counts = { hadir: 0, absen: 0, izin: 0, sakit: 0 };
        for (const st of Object.values(s.statuses)) {
          if (st in counts) counts[st as keyof typeof counts] += 1;
        }
        return { ...s, counts };
      });

      res.json({
        class: { id: cls.id, name: cls.name, program: cls.program.name },
        month,
        sessionDates,
        students,
      });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

// ── CUTI GURU ──
const cutiSchema = z.object({
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
  reason: z.string().trim().max(255).optional().nullable(),
  badalTeacherId: z.coerce.number().int().positive().nullable().optional(),
});

router.post(
  "/cuti",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const teacher = await myTeacher(req);
      const parsed = cutiSchema.safeParse({
        start: req.body?.start ?? req.body?.tanggal_mulai,
        end: req.body?.end ?? req.body?.tanggal_selesai,
        reason: req.body?.reason ?? req.body?.alasan ?? null,
        badalTeacherId: req.body?.badalTeacherId ?? req.body?.badal_teacher_id ?? null,
      });
      if (!parsed.success) {
        res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const start = new Date(parsed.data.start);
      const end = new Date(parsed.data.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        res.status(400).json({ message: "Format tanggal tidak valid (YYYY-MM-DD)." });
        return;
      }
      if (end < start) {
        res.status(400).json({ message: "Tanggal selesai tidak boleh sebelum tanggal mulai." });
        return;
      }

      if (parsed.data.badalTeacherId) {
        const badal = await prisma.teacher.findFirst({
          where: { id: parsed.data.badalTeacherId, isActive: true, deletedAt: null },
        });
        if (!badal) {
          res.status(404).json({ message: "Guru badal tidak ditemukan." });
          return;
        }
      }

      const leave = await prisma.teacherLeave.create({
        data: {
          teacherId: teacher.id,
          dateStart: start,
          dateEnd: end,
          reason: parsed.data.reason ?? null,
          badalTeacherId: parsed.data.badalTeacherId ?? null,
          status: "pending",
        },
        include: { badalTeacher: { select: { id: true, name: true } } },
      });

      res.status(201).json({ leave, message: "Pengajuan cuti terkirim, menunggu persetujuan admin." });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

router.get(
  "/cuti",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const teacher = await myTeacher(req);
      const leaves = await prisma.teacherLeave.findMany({
        where: { teacherId: teacher.id },
        include: { badalTeacher: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      });
      res.json({ leaves });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

// Daftar guru lain (untuk pilihan badal)
router.get(
  "/guru-lain",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const teacher = await myTeacher(req);
      const teachers = await prisma.teacher.findMany({
        where: { isActive: true, deletedAt: null, id: { not: teacher.id } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      res.json({ teachers });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
      }
      throw err;
    }
  })
);

export default router;
