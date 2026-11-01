import { Router, Request, Response } from "express";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/verifyToken";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { sanitizeWA, isValidWA } from "../utils/sanitizeWA";
import { generateNoID } from "../utils/generateNoID";
import { buildWaPendaftaran, logWa } from "../services/wa";

const router = Router();

// PSB & manajemen peserta: hanya TU
router.use(verifyToken, requireRole(["TU"]));

// ── Upload setup (folder lokal backend/uploads) ──
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext =
      path.extname(file.originalname).toLowerCase() ||
      (file.mimetype === "application/pdf" ? ".pdf" : ".jpg");
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

function uploadSingle(field: string, allowedMime: string[]) {
  const uploader = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // maks 2MB
    fileFilter: (_req, file, cb) => {
      if (allowedMime.includes(file.mimetype)) cb(null, true);
      else cb(new Error("Tipe file tidak diizinkan."));
    },
  });

  return (req: Request, res: Response, next: (err?: unknown) => void) => {
    uploader.single(field)(req, res, (err: unknown) => {
      if (err) {
        const msg =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "Ukuran file maksimal 2MB."
            : err instanceof Error
              ? err.message
              : "Upload gagal.";
        res.status(400).json({ message: msg });
        return;
      }
      next();
    });
  };
}

const uploadFoto = uploadSingle("foto", ["image/jpeg", "image/png"]);
const uploadKtp = uploadSingle("ktp", ["image/jpeg", "image/png", "application/pdf"]);

function branchIdOf(req: Request): number | null {
  return req.user?.branchId ?? null;
}

// Normalisasi body: terima snake_case (sesuai spec) maupun camelCase
function normalizeStudentBody(body: Record<string, unknown>) {
  return {
    name: body.name ?? body.nama,
    whatsapp: body.whatsapp,
    dob: body.dob ?? null,
    gender: body.gender ?? null,
    address: body.address ?? null,
    parentName: body.parentName ?? body.parent_name ?? null,
    parentPhone: body.parentPhone ?? body.parent_phone ?? null,
    programId: body.programId ?? body.program_id,
    classId: body.classId ?? body.class_id,
  };
}

const studentCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama peserta minimal 2 karakter").max(120),
  whatsapp: z.string().trim().min(8, "Nomor WhatsApp wajib diisi"),
  dob: z.string().trim().nullable().optional(),
  gender: z.enum(["L", "P"]).nullable().optional(),
  address: z.string().trim().max(255).nullable().optional(),
  parentName: z.string().trim().max(120).nullable().optional(),
  parentPhone: z.string().trim().max(30).nullable().optional(),
  programId: z.coerce.number().int().positive("Program wajib dipilih"),
  classId: z.coerce.number().int().positive("Kelas wajib dipilih"),
});

const studentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  whatsapp: z.string().trim().min(8).optional(),
  dob: z.string().trim().nullable().optional(),
  gender: z.enum(["L", "P"]).nullable().optional(),
  address: z.string().trim().max(255).nullable().optional(),
  parentName: z.string().trim().max(120).nullable().optional(),
  parentPhone: z.string().trim().max(30).nullable().optional(),
});

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ─────────────────────────── LIST PESERTA ───────────────────────────
// GET /api/students?status=active&programId=1&classId=2&search=nama
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun belum terhubung ke cabang." });
      return;
    }

    const statusRaw = String(req.query.status ?? "").trim();
    const status = ["active", "inactive", "cuti"].includes(statusRaw)
      ? (statusRaw as "active" | "inactive" | "cuti")
      : undefined;
    const programId = req.query.programId ? Number(req.query.programId) : undefined;
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const search = String(req.query.search ?? "").trim();

    const students = await prisma.student.findMany({
      where: {
        branchId,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { noid: { contains: search, mode: "insensitive" as const } },
                { whatsapp: { contains: search } },
              ],
            }
          : {}),
        ...(programId || classId
          ? {
              enrollments: {
                some: {
                  status: "active" as const,
                  ...(programId ? { programId } : {}),
                  ...(classId ? { classId } : {}),
                },
              },
            }
          : {}),
      },
      include: {
        enrollments: {
          include: {
            program: { select: { id: true, name: true } },
            class: {
              select: { id: true, name: true, teacher: { select: { id: true, name: true } } },
            },
          },
          orderBy: { enrolledAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = students.map((s) => {
      // utamakan enrollment aktif; jika tidak ada (nonaktif), tampilkan riwayat terakhir
      const activeEnrollments = s.enrollments.filter((e) => e.status === "active");
      const shown = activeEnrollments.length > 0 ? activeEnrollments : s.enrollments;
      const first = shown[0];
      return {
        id: s.id,
        noid: s.noid,
        name: s.name,
        whatsapp: s.whatsapp,
        status: s.status,
        photoUrl: s.photoUrl,
        programs: shown.map((e) => e.program.name),
        classes: shown.map((e) => e.class.name),
        teachers: shown.map((e) => e.class.teacher?.name ?? null),
        program: first?.program.name ?? null,
        kelas: first?.class.name ?? null,
        nama_guru: first?.class.teacher?.name ?? null,
        createdAt: s.createdAt,
      };
    });

    res.json({ students: data });
  })
);

// ─────────────────────────── DETAIL PESERTA ───────────────────────────
// GET /api/students/:id
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const student = await prisma.student.findFirst({
      where: { id, branchId },
      include: {
        enrollments: {
          include: {
            program: { select: { id: true, name: true } },
            class: {
              select: {
                id: true,
                name: true,
                scheduleDays: true,
                scheduleTime: true,
                teacher: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { payments: { orderBy: { createdAt: "desc" } } },
        },
        attendances: {
          take: 10,
          orderBy: { sessionDate: "desc" },
          include: { class: { select: { name: true } } },
        },
        grades: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { class: { select: { name: true } } },
        },
      },
    });

    if (!student) {
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    res.json({ student });
  })
);

// ─────────────────────────── DAFTARKAN PESERTA BARU ───────────────────────────
// POST /api/students
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    if (!branchId) {
      res.status(403).json({ message: "Akun belum terhubung ke cabang." });
      return;
    }

    const parsed = studentCreateSchema.safeParse(normalizeStudentBody(req.body ?? {}));
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const whatsapp = sanitizeWA(d.whatsapp);
    if (!isValidWA(whatsapp)) {
      res.status(400).json({ message: "Nomor WhatsApp tidak valid (contoh: 081234567890)." });
      return;
    }

    const parentPhone = d.parentPhone ? sanitizeWA(d.parentPhone) : null;

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // 1) kelas & program harus valid milik cabang
          const cls = await tx.class.findFirst({
            where: { id: d.classId, branchId, isActive: true },
            include: {
              teacher: { select: { id: true, name: true } },
              program: { select: { id: true, name: true, isActive: true } },
            },
          });
          if (!cls) throw new HttpError(404, "Kelas tidak ditemukan atau nonaktif.");
          if (!cls.program.isActive) throw new HttpError(400, "Program kelas tersebut sudah nonaktif.");
          if (cls.programId !== d.programId) {
            throw new HttpError(400, "Kelas yang dipilih bukan bagian dari program tersebut.");
          }

          // 2) kelas wajib punya guru
          if (!cls.teacherId || !cls.teacher) {
            throw new HttpError(400, "Kelas belum memiliki guru.");
          }

          // 3) kuota kelas
          const filled = await tx.enrollment.count({
            where: { classId: cls.id, status: "active" },
          });
          const sisa = cls.capacity - filled;
          if (sisa <= 0) {
            throw new HttpError(
              400,
              "Kelas sudah penuh. Silakan pilih kelas lain.",
              { sisaKuota: 0, kapasitas: cls.capacity }
            );
          }

          // 4) NoID
          const noid = await generateNoID(tx, branchId);

          // 5) peserta + enrollment
          const student = await tx.student.create({
            data: {
              branchId,
              noid,
              name: d.name,
              whatsapp,
              dob: toDate(d.dob),
              gender: d.gender ?? null,
              address: d.address ?? null,
              parentName: d.parentName ?? null,
              parentPhone,
              status: "active",
            },
          });

          const enrollment = await tx.enrollment.create({
            data: {
              studentId: student.id,
              classId: cls.id,
              programId: cls.programId,
              status: "active",
            },
          });

          return { student, enrollment, cls, sisaKuota: sisa - 1 };
        },
        { isolationLevel: "Serializable" }
      );

      // 6) Log WA #1 (pengiriman aktual di M4-C)
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      const message = buildWaPendaftaran({
        nama: result.student.name,
        program: result.cls.program.name,
        kelas: result.cls.name,
        jadwal: `${result.cls.scheduleDays}, ${result.cls.scheduleTime}`,
        noid: result.student.noid,
        nominal: "0",
        rekening_bank: branch?.bankAccount ?? "-",
        nama_lembaga: branch?.name ?? "LTQ Markaz AlQuran",
      });
      await logWa({ recipient: result.student.whatsapp, message, triggerType: "#1" });

      res.status(201).json({
        student: result.student,
        enrollment: result.enrollment,
        noid: result.student.noid,
        sisaKuota: result.sisaKuota,
        message: `Peserta berhasil didaftarkan dengan NoID ${result.student.noid}.`,
      });
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message, ...(err.extra ?? {}) });
        return;
      }
      throw err;
    }
  })
);

// ─────────────────────────── UPDATE BIODATA ───────────────────────────
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = studentUpdateSchema.safeParse(normalizeStudentBody(req.body ?? {}));
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const d = parsed.data;

    const existing = await prisma.student.findFirst({ where: { id, branchId } });
    if (!existing) {
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    let whatsapp: string | undefined;
    if (d.whatsapp !== undefined) {
      whatsapp = sanitizeWA(d.whatsapp);
      if (!isValidWA(whatsapp)) {
        res.status(400).json({ message: "Nomor WhatsApp tidak valid (contoh: 081234567890)." });
        return;
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(whatsapp !== undefined ? { whatsapp } : {}),
        ...(d.dob !== undefined ? { dob: toDate(d.dob) } : {}),
        ...(d.gender !== undefined ? { gender: d.gender } : {}),
        ...(d.address !== undefined ? { address: d.address } : {}),
        ...(d.parentName !== undefined ? { parentName: d.parentName } : {}),
        ...(d.parentPhone !== undefined
          ? { parentPhone: d.parentPhone ? sanitizeWA(d.parentPhone) : null }
          : {}),
      },
    });

    res.json({ student, message: "Biodata peserta diperbarui." });
  })
);

// ─────────────────────────── UPLOAD FOTO / KTP ───────────────────────────
router.post(
  "/:id/upload-foto",
  uploadFoto,
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "File foto wajib diunggah (field: foto)." });
      return;
    }

    const existing = await prisma.student.findFirst({ where: { id, branchId } });
    if (!existing) {
      fs.rm(req.file.path, { force: true }, () => {});
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    // hapus file lama (jika ada)
    if (existing.photoUrl) {
      fs.rm(path.join(UPLOAD_DIR, existing.photoUrl), { force: true }, () => {});
    }

    const student = await prisma.student.update({
      where: { id },
      data: { photoUrl: req.file.filename },
    });

    res.json({ student, message: "Foto peserta berhasil diunggah." });
  })
);

router.post(
  "/:id/upload-ktp",
  uploadKtp,
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "File KTP wajib diunggah (field: ktp)." });
      return;
    }

    const existing = await prisma.student.findFirst({ where: { id, branchId } });
    if (!existing) {
      fs.rm(req.file.path, { force: true }, () => {});
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    if (existing.ktpUrl) {
      fs.rm(path.join(UPLOAD_DIR, existing.ktpUrl), { force: true }, () => {});
    }

    const student = await prisma.student.update({
      where: { id },
      data: { ktpUrl: req.file.filename },
    });

    res.json({ student, message: "KTP peserta berhasil diunggah." });
  })
);

// Akses file hanya lewat endpoint terautentikasi (bukan static publik)
router.get(
  "/:id/foto",
  asyncHandler(async (req: Request, res: Response) => {
    await sendStudentFile(req, res, "photoUrl");
  })
);

router.get(
  "/:id/ktp",
  asyncHandler(async (req: Request, res: Response) => {
    await sendStudentFile(req, res, "ktpUrl");
  })
);

async function sendStudentFile(
  req: Request,
  res: Response,
  field: "photoUrl" | "ktpUrl"
): Promise<void> {
  const branchId = branchIdOf(req);
  const id = Number(req.params.id);
  if (!branchId || Number.isNaN(id)) {
    res.status(400).json({ message: "Permintaan tidak valid." });
    return;
  }

  const student = await prisma.student.findFirst({ where: { id, branchId } });
  const filename = student?.[field];
  if (!student || !filename) {
    res.status(404).json({ message: "File tidak ditemukan." });
    return;
  }

  const abs = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(abs)) {
    res.status(404).json({ message: "File tidak ditemukan di server." });
    return;
  }

  res.sendFile(abs);
}

// ─────────────────────────── STATUS PESERTA ───────────────────────────
router.post(
  "/:id/nonaktifkan",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const existing = await prisma.student.findFirst({ where: { id, branchId } });
    if (!existing) {
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    const student = await prisma.student.update({
      where: { id },
      data: { status: "inactive", deletedAt: new Date() },
    });

    res.json({ student, message: "Peserta dinonaktifkan." });
  })
);

const cutiSchema = z.object({
  start: z.string().trim().min(1, "Tanggal mulai wajib diisi"),
  end: z.string().trim().min(1, "Tanggal selesai wajib diisi"),
  reason: z.string().trim().max(255).optional().nullable(),
});

router.post(
  "/:id/cuti",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = cutiSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const start = toDate(parsed.data.start);
    const end = toDate(parsed.data.end);
    if (!start || !end) {
      res.status(400).json({ message: "Format tanggal tidak valid (gunakan YYYY-MM-DD)." });
      return;
    }
    if (end < start) {
      res.status(400).json({ message: "Tanggal selesai tidak boleh sebelum tanggal mulai." });
      return;
    }

    const existing = await prisma.student.findFirst({ where: { id, branchId } });
    if (!existing) {
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        status: "cuti",
        cutiStart: start,
        cutiEnd: end,
        cutiReason: parsed.data.reason ?? null,
      },
    });

    res.json({ student, message: "Peserta ditandai cuti." });
  })
);

// ─────────────────────────── DAFTAR ULANG (invoice semester baru) ───────────────────────────
const daftarUlangSchema = z.object({
  period: z
    .string()
    .trim()
    .regex(/^\d{4}-(\d{2}|S[12])$/, "Format periode: YYYY-MM atau YYYY-Sn"),
  components: z
    .array(
      z.object({
        nama: z.string().trim().min(1),
        jumlah: z.coerce.number().nonnegative(),
      })
    )
    .min(1, "Minimal satu komponen biaya"),
});

router.post(
  "/:id/daftar-ulang",
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = branchIdOf(req);
    const id = Number(req.params.id);
    if (!branchId || Number.isNaN(id)) {
      res.status(400).json({ message: "Permintaan tidak valid." });
      return;
    }

    const parsed = daftarUlangSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const student = await prisma.student.findFirst({ where: { id, branchId } });
    if (!student) {
      res.status(404).json({ message: "Peserta tidak ditemukan." });
      return;
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { studentId: id, period: parsed.data.period },
    });
    if (existingInvoice) {
      res.status(409).json({
        message: `Peserta ini sudah memiliki invoice untuk periode ${parsed.data.period}.`,
      });
      return;
    }

    const total = parsed.data.components.reduce((sum, c) => sum + c.jumlah, 0);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const invoice = await prisma.invoice.create({
      data: {
        studentId: id,
        branchId,
        period: parsed.data.period,
        components: parsed.data.components,
        totalAmount: total,
        dueDate,
        status: "unpaid",
      },
    });

    res.status(201).json({ invoice, message: "Invoice daftar ulang dibuat." });
  })
);

// ─────────────────────────── helper error ───────────────────────────
class HttpError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export default router;
