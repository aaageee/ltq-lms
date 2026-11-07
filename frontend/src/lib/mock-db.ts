// Mock database in-memory untuk MODE PREVIEW (NEXT_PUBLIC_DEV_MODE=true).
// Dipakai di build GitHub Pages agar CRUD tetap bisa dicoba tanpa backend.
// Data kembali ke seed saat halaman di-reload.

import type { ClassRow, Program, Teacher } from "./types-m2";
import type { StudentDetail, StudentRow, StudentStatus } from "./types-m3";
import type { InvoiceRow } from "./types-m4";

export class MockApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface MockState {
  programs: Program[];
  teachers: Teacher[];
  classes: ClassRow[];
  students: StudentDetail[];
  invoices: InvoiceRow[];
  attendances: { id: number; classId: number; studentId: number; sessionDate: string; studentStatus: string; teacherStatus: string }[];
  leaves: { id: number; teacherId: number; dateStart: string; dateEnd: string; reason: string | null; badalTeacherId: number | null; status: string; createdAt: string }[];
  reportCards: { id: number; studentId: number; classId: number; period: string; finalScore: number | null; teacherNotes: string | null; levelRecommendation: string | null; issuedAt: string; class: { id: number; name: string } }[];
  levelRequests: { id: number; studentId: number; classId: number; fromLevel: string | null; toLevel: string; notes: string | null; status: string; createdAt: string }[];
  nextProgramId: number;
  nextTeacherId: number;
  nextClassId: number;
  nextStudentId: number;
  nextEnrollmentId: number;
  nextGradeId: number;
  nextInvoiceId: number;
  nextAttendanceId: number;
  nextLeaveId: number;
  nextReportId: number;
  nextLevelReqId: number;
}

function seedBase() {
  const programs: Program[] = [
    { id: 1, name: "Tahsin", isActive: true },
    { id: 2, name: "Tartil", isActive: true },
    { id: 3, name: "Talaqqi", isActive: true },
  ];

  const teachers: Teacher[] = [
    { id: 1, name: "Ust. Abdul Karim", whatsapp: "6281234567890", specialization: "Tahsin", email: "abdul.karim@ltq.id", isActive: true, classes: [] },
    { id: 2, name: "Ust. Ibrahim", whatsapp: "6281298765432", specialization: "Tartil", email: "ibrahim@ltq.id", isActive: true, classes: [] },
    { id: 3, name: "Ust. Hamzah", whatsapp: "6281355566677", specialization: "Talaqqi", email: "hamzah@ltq.id", isActive: true, classes: [] },
    { id: 4, name: "Ustazah Aisyah", whatsapp: "6285711122233", specialization: "Tahsin & Tartil", email: "aisyah@ltq.id", isActive: true, classes: [] },
  ];

  const classes: ClassRow[] = [
    { id: 1, name: "Kelas Tahsin A", programId: 1, program: { id: 1, name: "Tahsin" }, teacherId: 1, teacher: { id: 1, name: "Ust. Abdul Karim" }, capacity: 15, filled: 12, scheduleDays: "Senin,Rabu,Minggu", scheduleTime: "09:00-10:00", room: "Ruang 1", isActive: true },
    { id: 2, name: "Kelas Tahsin B", programId: 1, program: { id: 1, name: "Tahsin" }, teacherId: 1, teacher: { id: 1, name: "Ust. Abdul Karim" }, capacity: 16, filled: 16, scheduleDays: "Selasa,Kamis", scheduleTime: "14:00-15:00", room: "Ruang 2", isActive: true },
    { id: 3, name: "Kelas Tartil A", programId: 2, program: { id: 2, name: "Tartil" }, teacherId: 2, teacher: { id: 2, name: "Ust. Ibrahim" }, capacity: 12, filled: 8, scheduleDays: "Senin,Kamis,Minggu", scheduleTime: "10:00-11:00", room: "Ruang 3", isActive: true },
    { id: 4, name: "Kelas Tartil B", programId: 2, program: { id: 2, name: "Tartil" }, teacherId: 2, teacher: { id: 2, name: "Ust. Ibrahim" }, capacity: 12, filled: 10, scheduleDays: "Selasa,Jumat", scheduleTime: "14:00-15:00", room: "Ruang 3", isActive: true },
    { id: 5, name: "Kelas Talaqqi A", programId: 3, program: { id: 3, name: "Talaqqi" }, teacherId: 3, teacher: { id: 3, name: "Ust. Hamzah" }, capacity: 10, filled: 6, scheduleDays: "Rabu", scheduleTime: "13:00-14:30", room: "Ruang 4", isActive: true },
    { id: 6, name: "Kelas Tahsin C", programId: 1, program: { id: 1, name: "Tahsin" }, teacherId: null, teacher: null, capacity: 15, filled: 0, scheduleDays: "Sabtu", scheduleTime: "08:00-09:00", room: "Ruang 1", isActive: true },
  ];

  for (const t of teachers) {
    t.classes = classes
      .filter((c) => c.teacherId === t.id && c.isActive)
      .map((c) => ({ id: c.id, name: c.name }));
  }

  return { programs, teachers, classes };
}

function enrollmentFor(studentId: number, classRow: ClassRow, status = "active") {
  return {
    id: 1000 + studentId,
    status,
    program: { id: classRow.program.id, name: classRow.program.name },
    class: {
      id: classRow.id,
      name: classRow.name,
      scheduleDays: classRow.scheduleDays,
      scheduleTime: classRow.scheduleTime,
      teacher: classRow.teacher,
    },
  };
}

function seedStudents(classes: ClassRow[]): StudentDetail[] {
  const base = [
    { name: "Muhammad Rizky", wa: "6281234567890", classId: 1, status: "active" as StudentStatus, gender: "L" as const },
    { name: "Aisyah Putri", wa: "6281234567891", classId: 3, status: "active" as StudentStatus, gender: "P" as const },
    { name: "Abdurrahman Hakim", wa: "6281234567892", classId: 5, status: "active" as StudentStatus, gender: "L" as const },
    { name: "Fatimah Az-Zahra", wa: "6281234567893", classId: 1, status: "active" as StudentStatus, gender: "P" as const },
    { name: "Yusuf Al-Amin", wa: "6281234567894", classId: 3, status: "active" as StudentStatus, gender: "L" as const },
    { name: "Khadijah Nur", wa: "6281234567895", classId: 2, status: "cuti" as StudentStatus, gender: "P" as const },
    { name: "Ibrahim Sulaiman", wa: "6281234567896", classId: 4, status: "active" as StudentStatus, gender: "L" as const },
    { name: "Ruqayyah Hanin", wa: "6281234567897", classId: 2, status: "inactive" as StudentStatus, gender: "P" as const },
  ];

  return base.map((s, i) => {
    const id = i + 1;
    const cls = classes.find((c) => c.id === s.classId)!;
    return {
      id,
      noid: `LTQ-JKT-2026-${String(id).padStart(3, "0")}`,
      name: s.name,
      whatsapp: s.wa,
      dob: i % 2 === 0 ? "2010-05-12" : null,
      gender: s.gender,
      address: i % 2 === 0 ? "Jl. Merdeka No. 1, Jakarta" : null,
      photoUrl: null,
      ktpUrl: null,
      parentName: i % 2 === 0 ? `Bpk. ${s.name.split(" ")[0]} Sr.` : null,
      parentPhone: i % 2 === 0 ? "6281298765432" : null,
      status: s.status,
      cutiStart: s.status === "cuti" ? "2026-11-10" : null,
      cutiEnd: s.status === "cuti" ? "2026-11-20" : null,
      cutiReason: s.status === "cuti" ? "Sakit" : null,
      createdAt: "2026-10-0" + ((i % 9) + 1) + "T08:00:00.000Z",
      enrollments: [enrollmentFor(id, cls, s.status === "inactive" ? "dropped" : "active")],
      invoices: [],
      attendances: [],
      grades: [],
    };
  });
}

function seed(): MockState {
  const { programs, teachers, classes } = seedBase();
  const students = seedStudents(classes);

  // data demo detail untuk peserta #1
  const s1 = students[0];
  s1.invoices = [
    {
      id: 1,
      period: "2026-10",
      components: [{ nama: "SPP", jumlah: 300000 }, { nama: "Kegiatan", jumlah: 50000 }],
      totalAmount: 350000,
      dueDate: "2026-10-07T00:00:00.000Z",
      status: "paid",
      createdAt: "2026-10-01T00:00:00.000Z",
      payments: [{ id: 1, amount: 350000, confirmedAt: "2026-10-05T09:00:00.000Z", createdAt: "2026-10-05T08:00:00.000Z" }],
    },
    {
      id: 2,
      period: "2026-11",
      components: [{ nama: "SPP", jumlah: 300000 }],
      totalAmount: 300000,
      dueDate: "2026-11-07T00:00:00.000Z",
      status: "unpaid",
      createdAt: "2026-11-01T00:00:00.000Z",
      payments: [],
    },
  ];
  s1.attendances = [
    { id: 1, sessionDate: "2026-11-02T09:00:00.000Z", studentStatus: "hadir", teacherStatus: "hadir", class: { name: "Kelas Tahsin A" } },
    { id: 2, sessionDate: "2026-10-29T09:00:00.000Z", studentStatus: "hadir", teacherStatus: "hadir", class: { name: "Kelas Tahsin A" } },
    { id: 3, sessionDate: "2026-10-27T09:00:00.000Z", studentStatus: "izin", teacherStatus: "hadir", class: { name: "Kelas Tahsin A" } },
    { id: 4, sessionDate: "2026-10-22T09:00:00.000Z", studentStatus: "hadir", teacherStatus: "hadir", class: { name: "Kelas Tahsin A" } },
  ];
  s1.grades = [
    { id: 1, gradeType: "harian", score: 88, notes: "Bacaan lancar", createdAt: "2026-10-29T10:00:00.000Z", class: { name: "Kelas Tahsin A" } },
    { id: 2, gradeType: "ujian", score: 92, notes: "Tajwid baik", createdAt: "2026-10-25T10:00:00.000Z", class: { name: "Kelas Tahsin A" } },
    { id: 3, gradeType: "harian", score: 75, notes: "Perlu latihan makhraj", createdAt: "2026-10-20T10:00:00.000Z", class: { name: "Kelas Tahsin A" } },
  ];

  const invoices: InvoiceRow[] = [
    {
      id: 1, studentId: 1, period: "2026-10",
      components: [{ nama: "SPP", jumlah: 300000 }, { nama: "Kegiatan", jumlah: 50000 }],
      totalAmount: 350000, dueDate: "2026-10-07T00:00:00.000Z", status: "paid",
      createdAt: "2026-10-01T00:00:00.000Z",
      student: { id: 1, noid: "LTQ-JKT-2026-001", name: "Muhammad Rizky", whatsapp: "6281234567890" },
      payments: [{ id: 1, amount: 350000, method: "transfer", proofUrl: null, confirmedAt: "2026-10-05T09:00:00.000Z", createdAt: "2026-10-05T08:00:00.000Z" }],
    },
    {
      id: 2, studentId: 2, period: "2026-11",
      components: [{ nama: "SPP", jumlah: 300000 }],
      totalAmount: 300000, dueDate: "2026-11-14T00:00:00.000Z", status: "unpaid",
      createdAt: "2026-11-01T00:00:00.000Z",
      student: { id: 2, noid: "LTQ-JKT-2026-002", name: "Aisyah Putri", whatsapp: "6281234567891" },
      payments: [],
    },
    {
      id: 3, studentId: 3, period: "2026-09",
      components: [{ nama: "SPP", jumlah: 300000 }],
      totalAmount: 300000, dueDate: "2026-09-07T00:00:00.000Z", status: "overdue",
      createdAt: "2026-09-01T00:00:00.000Z",
      student: { id: 3, noid: "LTQ-JKT-2026-003", name: "Abdurrahman Hakim", whatsapp: "6281234567892" },
      payments: [],
    },
    {
      id: 4, studentId: 4, period: "2026-11",
      components: [{ nama: "SPP", jumlah: 300000 }, { nama: "Kegiatan", jumlah: 50000 }],
      totalAmount: 350000, dueDate: "2026-11-10T00:00:00.000Z", status: "unpaid",
      createdAt: "2026-11-03T00:00:00.000Z",
      student: { id: 4, noid: "LTQ-JKT-2026-004", name: "Fatimah Az-Zahra", whatsapp: "6281234567893" },
      payments: [],
    },
    {
      id: 5, studentId: 5, period: "2026-11",
      components: [{ nama: "SPP", jumlah: 300000 }],
      totalAmount: 300000, dueDate: "2026-11-14T00:00:00.000Z", status: "unpaid",
      createdAt: "2026-11-04T00:00:00.000Z",
      student: { id: 5, noid: "LTQ-JKT-2026-005", name: "Yusuf Al-Amin", whatsapp: "6281234567894" },
      payments: [],
    },
  ];

  const attendances = [
    { id: 1, classId: 1, studentId: 1, sessionDate: "2026-11-01T09:00:00.000Z", studentStatus: "hadir", teacherStatus: "hadir" },
    { id: 2, classId: 1, studentId: 4, sessionDate: "2026-11-01T09:00:00.000Z", studentStatus: "hadir", teacherStatus: "hadir" },
    { id: 3, classId: 1, studentId: 1, sessionDate: "2026-11-03T09:00:00.000Z", studentStatus: "hadir", teacherStatus: "hadir" },
    { id: 4, classId: 1, studentId: 4, sessionDate: "2026-11-03T09:00:00.000Z", studentStatus: "izin", teacherStatus: "hadir" },
    { id: 5, classId: 1, studentId: 1, sessionDate: "2026-11-05T09:00:00.000Z", studentStatus: "hadir", teacherStatus: "hadir" },
    { id: 6, classId: 1, studentId: 4, sessionDate: "2026-11-05T09:00:00.000Z", studentStatus: "absen", teacherStatus: "hadir" },
  ];
  const leaves: MockState["leaves"] = [];
  const reportCards: MockState["reportCards"] = [
    { id: 1, studentId: 1, classId: 1, period: "2026-S1", finalScore: 88, teacherNotes: "Bacaan lancar, tajwid baik", levelRecommendation: "Naik ke Level 2", issuedAt: "2026-11-07T00:00:00.000Z", class: { id: 1, name: "Kelas Tahsin A" } },
  ];
  const levelRequests: MockState["levelRequests"] = [
    { id: 1, studentId: 1, classId: 1, fromLevel: "Level 1", toLevel: "Level 2", notes: "Sudah lancar", status: "pending", createdAt: "2026-11-07T00:00:00.000Z" },
  ];

  return {
    programs,
    teachers,
    classes,
    students,
    invoices,
    attendances,
    leaves,
    reportCards,
    levelRequests,
    nextProgramId: 4,
    nextTeacherId: 5,
    nextClassId: 7,
    nextStudentId: 9,
    nextEnrollmentId: 2000,
    nextGradeId: 4,
    nextInvoiceId: 6,
    nextAttendanceId: 7,
    nextLeaveId: 1,
    nextReportId: 2,
    nextLevelReqId: 2,
  };
}

let state = seed();

export function resetMockDb(): void {
  state = seed();
}

function sanitizeWhatsapp(input: string): string {
  let digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits;
}

function withClassCount(p: Program): Program {
  return { ...p, _count: { classes: state.classes.filter((c) => c.programId === p.id && c.isActive).length } };
}

function toStudentRow(s: StudentDetail): StudentRow {
  const active = s.enrollments.filter((e) => e.status === "active");
  const shown = active.length > 0 ? active : s.enrollments;
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
    createdAt: s.createdAt ?? new Date().toISOString(),
  };
}

function generateNoID(): string {
  const year = new Date().getFullYear();
  const prefix = `LTQ-JKT-${year}-`;
  const lastSeq = state.students.reduce((max, s) => {
    if (!s.noid.startsWith(prefix)) return max;
    const n = Number.parseInt(s.noid.slice(prefix.length), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${prefix}${String(lastSeq + 1).padStart(3, "0")}`;
}

// Router mock: meniru endpoint backend
export async function mockRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  // tanpa delay: hindari timer throttling di tab background (dev/preview)

  const m = method.toUpperCase();
  const [rawPath, queryString] = path.split("?");
  const [, resource, idPart, action] = rawPath.split("/");
  const id = idPart ? Number(idPart) : null;
  const payload = (body ?? {}) as Record<string, unknown>;
  const query = new URLSearchParams(queryString ?? "");

  // ── PROGRAMS ──
  if (resource === "programs") {
    if (m === "GET") {
      return { programs: state.programs.map(withClassCount) } as T;
    }
    if (m === "POST") {
      const name = String(payload.name ?? "").trim();
      if (name.length < 2) throw new MockApiError("Nama program minimal 2 karakter");
      const program: Program = { id: state.nextProgramId++, name, isActive: true };
      state.programs.push(program);
      return { program: withClassCount(program), message: "Program berhasil ditambahkan." } as T;
    }
    if (m === "PUT" && id) {
      const program = state.programs.find((p) => p.id === id);
      if (!program) throw new MockApiError("Program tidak ditemukan.", 404);
      if (payload.name !== undefined) {
        const name = String(payload.name).trim();
        if (name.length < 2) throw new MockApiError("Nama program minimal 2 karakter");
        program.name = name;
      }
      if (payload.isActive !== undefined) program.isActive = Boolean(payload.isActive);
      return { program: withClassCount(program), message: "Program berhasil diperbarui." } as T;
    }
    if (m === "DELETE" && id) {
      const program = state.programs.find((p) => p.id === id);
      if (!program) throw new MockApiError("Program tidak ditemukan.", 404);
      program.isActive = false;
      return { program: withClassCount(program), message: "Program dinonaktifkan." } as T;
    }
  }

  // ── CLASSES ──
  if (resource === "classes") {
    if (m === "GET") return { classes: state.classes } as T;
    if (m === "POST") {
      const name = String(payload.name ?? "").trim();
      const programId = Number(payload.programId);
      const capacity = Number(payload.capacity);
      const program = state.programs.find((p) => p.id === programId && p.isActive);
      if (!program) throw new MockApiError("Program tidak ditemukan atau nonaktif.");
      if (name.length < 2) throw new MockApiError("Nama kelas minimal 2 karakter");
      if (!Number.isFinite(capacity) || capacity < 1) throw new MockApiError("Kapasitas minimal 1");
      const teacherId = payload.teacherId ? Number(payload.teacherId) : null;
      const teacher = teacherId ? state.teachers.find((t) => t.id === teacherId && t.isActive) : null;
      if (teacherId && !teacher) throw new MockApiError("Guru tidak ditemukan atau tidak aktif.");
      const row: ClassRow = {
        id: state.nextClassId++,
        name,
        programId: program.id,
        program: { id: program.id, name: program.name },
        teacherId: teacher?.id ?? null,
        teacher: teacher ? { id: teacher.id, name: teacher.name } : null,
        capacity,
        filled: 0,
        scheduleDays: String(payload.scheduleDays ?? ""),
        scheduleTime: String(payload.scheduleTime ?? ""),
        room: payload.room ? String(payload.room) : null,
        isActive: true,
      };
      state.classes.push(row);
      if (teacher) teacher.classes.push({ id: row.id, name: row.name });
      return { class: row, message: "Kelas berhasil ditambahkan." } as T;
    }
    if (m === "PUT" && id) {
      const row = state.classes.find((c) => c.id === id);
      if (!row) throw new MockApiError("Kelas tidak ditemukan.", 404);
      if (payload.name !== undefined) row.name = String(payload.name).trim();
      if (payload.programId !== undefined) {
        const program = state.programs.find((p) => p.id === Number(payload.programId));
        if (!program) throw new MockApiError("Program tidak ditemukan.");
        row.programId = program.id;
        row.program = { id: program.id, name: program.name };
      }
      if (payload.teacherId !== undefined) {
        const teacherId = payload.teacherId ? Number(payload.teacherId) : null;
        const teacher = teacherId ? state.teachers.find((t) => t.id === teacherId && t.isActive) : null;
        if (teacherId && !teacher) throw new MockApiError("Guru tidak ditemukan atau tidak aktif.");
        for (const t of state.teachers) t.classes = t.classes.filter((c) => c.id !== row.id);
        row.teacherId = teacher?.id ?? null;
        row.teacher = teacher ? { id: teacher.id, name: teacher.name } : null;
        if (teacher) teacher.classes.push({ id: row.id, name: row.name });
      }
      if (payload.capacity !== undefined) row.capacity = Number(payload.capacity);
      if (payload.scheduleDays !== undefined) row.scheduleDays = String(payload.scheduleDays);
      if (payload.scheduleTime !== undefined) row.scheduleTime = String(payload.scheduleTime);
      if (payload.room !== undefined) row.room = payload.room ? String(payload.room) : null;
      if (payload.isActive !== undefined) row.isActive = Boolean(payload.isActive);
      return { class: row, message: "Kelas berhasil diperbarui." } as T;
    }
    if (m === "DELETE" && id) {
      const row = state.classes.find((c) => c.id === id);
      if (!row) throw new MockApiError("Kelas tidak ditemukan.", 404);
      row.isActive = false;
      for (const t of state.teachers) t.classes = t.classes.filter((c) => c.id !== row.id);
      return { class: row, message: "Kelas dinonaktifkan." } as T;
    }
  }

  // ── TEACHERS ──
  if (resource === "teachers") {
    if (m === "GET") return { teachers: state.teachers } as T;
    if (m === "POST") {
      const name = String(payload.name ?? "").trim();
      const email = String(payload.email ?? "").trim().toLowerCase();
      if (name.length < 2) throw new MockApiError("Nama guru minimal 2 karakter");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new MockApiError("Email tidak valid");
      if (state.teachers.some((t) => t.email.toLowerCase() === email)) {
        throw new MockApiError("Email sudah digunakan akun lain.", 409);
      }
      const teacher: Teacher = {
        id: state.nextTeacherId++,
        name,
        whatsapp: sanitizeWhatsapp(String(payload.whatsapp ?? "")),
        specialization: payload.specialization ? String(payload.specialization) : null,
        email,
        isActive: true,
        classes: [],
      };
      state.teachers.push(teacher);
      return {
        teacher,
        message: "Guru ditambahkan. Password awal: ltq@2026 (wajib diganti saat login pertama).",
      } as T;
    }
    if (m === "PUT" && id) {
      const teacher = state.teachers.find((t) => t.id === id);
      if (!teacher) throw new MockApiError("Guru tidak ditemukan.", 404);
      if (payload.name !== undefined) teacher.name = String(payload.name).trim();
      if (payload.whatsapp !== undefined) teacher.whatsapp = sanitizeWhatsapp(String(payload.whatsapp));
      if (payload.specialization !== undefined) {
        teacher.specialization = payload.specialization ? String(payload.specialization) : null;
      }
      if (payload.email !== undefined) {
        const email = String(payload.email).trim().toLowerCase();
        if (state.teachers.some((t) => t.id !== id && t.email.toLowerCase() === email)) {
          throw new MockApiError("Email sudah digunakan akun lain.", 409);
        }
        teacher.email = email;
      }
      if (payload.isActive !== undefined) teacher.isActive = Boolean(payload.isActive);
      return { teacher, message: "Data guru berhasil diperbarui." } as T;
    }
    if (m === "DELETE" && id) {
      const teacher = state.teachers.find((t) => t.id === id);
      if (!teacher) throw new MockApiError("Guru tidak ditemukan.", 404);
      teacher.isActive = false;
      teacher.classes = [];
      for (const c of state.classes) {
        if (c.teacherId === id) {
          c.teacherId = null;
          c.teacher = null;
        }
      }
      return { message: "Guru dinonaktifkan." } as T;
    }
  }

  // ── STUDENTS (M3) ──
  if (resource === "students") {
    if (m === "GET" && !id) {
      const status = query.get("status");
      const programId = query.get("programId") ? Number(query.get("programId")) : null;
      const classId = query.get("classId") ? Number(query.get("classId")) : null;
      const search = (query.get("search") ?? "").toLowerCase().trim();

      let rows = state.students.map(toStudentRow);
      if (status) rows = rows.filter((r) => r.status === status);
      if (programId) rows = rows.filter((r) => r.programs.includes(state.programs.find((p) => p.id === programId)?.name ?? "___"));
      if (classId) rows = rows.filter((r) => r.classes.includes(state.classes.find((c) => c.id === classId)?.name ?? "___"));
      if (search) {
        rows = rows.filter(
          (r) =>
            r.name.toLowerCase().includes(search) ||
            r.noid.toLowerCase().includes(search) ||
            r.whatsapp.includes(search)
        );
      }
      return { students: rows } as T;
    }

    if (m === "GET" && id && !action) {
      const student = state.students.find((s) => s.id === id);
      if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
      return {
        student: { ...student, invoices: state.invoices.filter((inv) => inv.studentId === id) },
      } as T;
    }

    if (m === "POST" && !id) {
      const name = String(payload.name ?? payload.nama ?? "").trim();
      const whatsapp = sanitizeWhatsapp(String(payload.whatsapp ?? ""));
      const programId = Number(payload.programId ?? payload.program_id);
      const classId = Number(payload.classId ?? payload.class_id);
      if (name.length < 2) throw new MockApiError("Nama peserta minimal 2 karakter");
      if (!/^62\d{8,13}$/.test(whatsapp)) throw new MockApiError("Nomor WhatsApp tidak valid (contoh: 081234567890).");

      const cls = state.classes.find((c) => c.id === classId && c.isActive);
      if (!cls) throw new MockApiError("Kelas tidak ditemukan atau nonaktif.", 404);
      const program = state.programs.find((p) => p.id === programId && p.isActive);
      if (!program) throw new MockApiError("Program tidak ditemukan atau nonaktif.");
      if (cls.programId !== programId) throw new MockApiError("Kelas yang dipilih bukan bagian dari program tersebut.");
      if (!cls.teacherId) throw new MockApiError("Kelas belum memiliki guru.");

      const filled = cls.filled;
      const sisa = cls.capacity - filled;
      if (sisa <= 0) {
        throw new MockApiError("Kelas sudah penuh. Silakan pilih kelas lain.");
      }

      const noid = generateNoID();
      const student: StudentDetail = {
        id: state.nextStudentId++,
        noid,
        name,
        whatsapp,
        dob: payload.dob ? String(payload.dob) : null,
        gender: payload.gender === "L" || payload.gender === "P" ? payload.gender : null,
        address: payload.address ? String(payload.address) : null,
        photoUrl: null,
        ktpUrl: null,
        parentName: payload.parentName ? String(payload.parentName) : null,
        parentPhone: payload.parentPhone ? sanitizeWhatsapp(String(payload.parentPhone)) : null,
        status: "active",
        cutiStart: null,
        cutiEnd: null,
        cutiReason: null,
        createdAt: new Date().toISOString(),
        enrollments: [
          {
            id: state.nextEnrollmentId++,
            status: "active",
            program: { id: cls.program.id, name: cls.program.name },
            class: {
              id: cls.id,
              name: cls.name,
              scheduleDays: cls.scheduleDays,
              scheduleTime: cls.scheduleTime,
              teacher: cls.teacher,
            },
          },
        ],
        invoices: [],
        attendances: [],
        grades: [],
      };
      state.students.push(student);
      cls.filled += 1;

      return {
        student,
        enrollment: student.enrollments[0],
        noid,
        sisaKuota: sisa - 1,
        message: `Peserta berhasil didaftarkan dengan NoID ${noid}.`,
      } as T;
    }

    if (m === "PUT" && id && !action) {
      const student = state.students.find((s) => s.id === id);
      if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
      if (payload.name !== undefined) student.name = String(payload.name).trim();
      if (payload.whatsapp !== undefined) student.whatsapp = sanitizeWhatsapp(String(payload.whatsapp));
      if (payload.dob !== undefined) student.dob = payload.dob ? String(payload.dob) : null;
      if (payload.gender !== undefined) student.gender = payload.gender === "L" || payload.gender === "P" ? payload.gender : null;
      if (payload.address !== undefined) student.address = payload.address ? String(payload.address) : null;
      if (payload.parentName !== undefined) student.parentName = payload.parentName ? String(payload.parentName) : null;
      if (payload.parentPhone !== undefined) {
        student.parentPhone = payload.parentPhone ? sanitizeWhatsapp(String(payload.parentPhone)) : null;
      }
      return { student, message: "Biodata peserta diperbarui." } as T;
    }

    if (m === "POST" && id && action === "upload-foto") {
      const student = state.students.find((s) => s.id === id);
      if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
      student.photoUrl = (payload.__uploadDataUrl as string) ?? null;
      return { student, message: "Foto peserta berhasil diunggah." } as T;
    }

    if (m === "POST" && id && action === "upload-ktp") {
      const student = state.students.find((s) => s.id === id);
      if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
      student.ktpUrl = (payload.__uploadDataUrl as string) ?? null;
      return { student, message: "KTP peserta berhasil diunggah." } as T;
    }

    if (m === "POST" && id && action === "nonaktifkan") {
      const student = state.students.find((s) => s.id === id);
      if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
      student.status = "inactive";
      return { student, message: "Peserta dinonaktifkan." } as T;
    }

    if (m === "POST" && id && action === "cuti") {
      const student = state.students.find((s) => s.id === id);
      if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
      student.status = "cuti";
      student.cutiStart = payload.start ? String(payload.start) : null;
      student.cutiEnd = payload.end ? String(payload.end) : null;
      student.cutiReason = payload.reason ? String(payload.reason) : null;
      return { student, message: "Peserta ditandai cuti." } as T;
    }
  }

  // ── INVOICES (M4) ──
  if (resource === "invoices") {
    if (m === "GET" && !idPart) {
      const status = query.get("status");
      const periode = query.get("periode");
      const search = (query.get("search") ?? "").toLowerCase().trim();
      let rows = [...state.invoices];
      if (status) rows = rows.filter((i) => i.status === status);
      if (periode) rows = rows.filter((i) => i.period === periode);
      if (search) rows = rows.filter((i) => i.student.name.toLowerCase().includes(search) || i.student.noid.toLowerCase().includes(search));
      return { invoices: rows.sort((a, b) => b.id - a.id) } as T;
    }

    if (m === "GET" && idPart === "tunggakan") {
      const rows = state.invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");
      const now = Date.now();
      const data = rows.map((i) => ({ ...i, daysOverdue: Math.max(0, Math.floor((now - new Date(i.dueDate).getTime()) / 86400000)) }));
      return { tunggakan: data, totalNominal: data.reduce((s2, i) => s2 + i.totalAmount, 0), jumlah: data.length } as T;
    }

    if (m === "POST" && !idPart) {
      const studentId = Number(payload.studentId ?? payload.student_id);
      const period = String(payload.period ?? payload.periode ?? "").trim();
      const components = (payload.components ?? []) as { nama: string; jumlah: number }[];
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new MockApiError('Format periode wajib "YYYY-MM" (contoh: 2026-01).');
      if (!Array.isArray(components) || components.length === 0) throw new MockApiError("Minimal satu komponen biaya.");
      const student = state.students.find((s) => s.id === studentId);
      if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
      if (state.invoices.some((i) => i.studentId === studentId && i.period === period)) {
        throw new MockApiError(`Peserta ini sudah memiliki invoice untuk periode ${period}. Konfirmasi pembayaran invoice yang ada terlebih dahulu.`, 409);
      }
      const totalAmount = components.reduce((sum, c) => sum + Number(c.jumlah), 0);
      const due = new Date();
      due.setDate(due.getDate() + 7);
      const invoice: InvoiceRow = {
        id: state.nextInvoiceId++,
        studentId,
        period,
        components,
        totalAmount,
        dueDate: due.toISOString(),
        status: "unpaid",
        createdAt: new Date().toISOString(),
        student: { id: student.id, noid: student.noid, name: student.name, whatsapp: student.whatsapp },
        payments: [],
      };
      state.invoices.push(invoice);
      return { invoice, message: "Invoice berhasil dibuat." } as T;
    }

    if (m === "PUT" && id && action === "konfirmasi-bayar") {
      const invoice = state.invoices.find((i) => i.id === id);
      if (!invoice) throw new MockApiError("Invoice tidak ditemukan.", 404);
      if (invoice.status === "paid") throw new MockApiError("Invoice ini sudah lunas.", 409);
      if (invoice.status === "cancelled") throw new MockApiError("Invoice sudah dibatalkan.", 409);
      const amount = Number(payload.amount);
      if (Math.abs(amount - invoice.totalAmount) > 0.01) {
        throw new MockApiError(
          `Nominal pembayaran harus sama dengan total tagihan (Rp ${new Intl.NumberFormat("id-ID").format(invoice.totalAmount)}). Pembayaran parsial tidak diperbolehkan.`
        );
      }
      const payment = {
        id: Date.now(),
        amount,
        method: payload.method ? String(payload.method) : null,
        proofUrl: payload.proofUrl ? String(payload.proofUrl) : null,
        confirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      invoice.status = "paid";
      invoice.payments = [payment, ...invoice.payments];
      return { invoice, payment, message: "Pembayaran berhasil dikonfirmasi." } as T;
    }

    if (m === "PUT" && id && action === "batalkan") {
      const invoice = state.invoices.find((i) => i.id === id);
      if (!invoice) throw new MockApiError("Invoice tidak ditemukan.", 404);
      const reason = String(payload.alasan ?? payload.reason ?? "").trim();
      if (!reason) throw new MockApiError("Alasan pembatalan wajib diisi.");
      if (invoice.status === "paid") throw new MockApiError("Invoice yang sudah lunas tidak bisa dibatalkan.", 409);
      invoice.status = "cancelled";
      invoice.cancelReason = reason;
      return { invoice, message: "Invoice dibatalkan." } as T;
    }

    if (m === "POST" && id && action === "kirim-reminder") {
      const invoice = state.invoices.find((i) => i.id === id);
      if (!invoice) throw new MockApiError("Invoice tidak ditemukan.", 404);
      if (invoice.status === "paid") throw new MockApiError("Invoice sudah lunas, tidak perlu reminder.", 409);
      const preview = `Assalamualaikum *${invoice.student.name}*,\n\n📋 Reminder tagihan SPP:\n💰 Nominal      : Rp ${new Intl.NumberFormat("id-ID").format(invoice.totalAmount)}\n📅 Jatuh tempo  : ${new Date(invoice.dueDate).toLocaleDateString("id-ID", { dateStyle: "long" })}\n\nSilakan transfer ke:\n🏦 1234567890 (Bank Syariah)\n   a.n LTQ Markaz AlQuran\n\nBalas pesan ini setelah transfer untuk konfirmasi.\nTerima kasih! 🙏`;
      return { message: "Reminder tagihan dicatat dan sedang dikirim via WhatsApp.", preview } as T;
    }

    if (m === "GET" && id && action === "kwitansi") {
      throw new MockApiError("Kwitansi PDF hanya tersedia saat terhubung ke backend.", 501);
    }
  }

  // ── GURU (M5) ──
  if (resource === "guru") {
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const today = dayNames[new Date().getDay()];
    const todayKey = new Date().toISOString().slice(0, 10);

    if (m === "GET" && idPart === "jadwal-hari-ini") {
      const kelas = state.classes
        .filter((c) => c.teacherId === 1 && c.isActive)
        .filter((c) => c.scheduleDays.split(",").map((d) => d.trim().toLowerCase()).includes(today.toLowerCase()))
        .map((c) => ({
          id: c.id,
          name: c.name,
          program: c.program.name,
          scheduleDays: c.scheduleDays,
          scheduleTime: c.scheduleTime,
          room: c.room,
          students: state.students.filter((st) => st.enrollments.some((e) => e.class.id === c.id && e.status === "active")).length,
          hasSession: state.attendances.some((a) => a.classId === c.id && a.sessionDate.slice(0, 10) === todayKey),
        }));
      return { hari: today, kelas } as T;
    }

    if (m === "GET" && idPart === "kelas" && !action) {
      return {
        classes: state.classes
          .filter((c) => c.teacherId === 1 && c.isActive)
          .map((c) => ({
            id: c.id,
            name: c.name,
            program: c.program.name,
            scheduleDays: c.scheduleDays,
            scheduleTime: c.scheduleTime,
            room: c.room,
            students: state.students.filter((st) => st.enrollments.some((e) => e.class.id === c.id && e.status === "active")).length,
          })),
      } as T;
    }

    if (m === "GET" && idPart === "guru-lain") {
      return { teachers: state.teachers.filter((t) => t.id !== 1 && t.isActive).map((t) => ({ id: t.id, name: t.name })) } as T;
    }

    if (m === "GET" && idPart === "cuti") {
      return { leaves: state.leaves } as T;
    }

    if (m === "POST" && idPart === "cuti") {
      const leave = {
        id: state.nextLeaveId++,
        teacherId: 1,
        dateStart: String(payload.start ?? ""),
        dateEnd: String(payload.end ?? ""),
        reason: payload.reason ? String(payload.reason) : null,
        badalTeacherId: payload.badalTeacherId ? Number(payload.badalTeacherId) : null,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      if (!leave.dateStart || !leave.dateEnd) throw new MockApiError("Tanggal cuti wajib diisi.");
      state.leaves.unshift(leave);
      return { leave, message: "Pengajuan cuti terkirim, menunggu persetujuan admin." } as T;
    }

    if (m === "GET" && idPart === "kelas" && rawPath.split("/")[4] === "siswa") {
      const classId = Number(rawPath.split("/")[3]);
      const cls = state.classes.find((c) => c.id === classId);
      if (!cls) throw new MockApiError("Kelas tidak ditemukan.", 404);
      const students = state.students
        .filter((st) => st.enrollments.some((e) => e.class.id === classId && e.status === "active"))
        .map((st) => {
          const att = state.attendances.find((a) => a.classId === classId && a.studentId === st.id && a.sessionDate.slice(0, 10) === todayKey);
          return { id: st.id, noid: st.noid, name: st.name, status: att?.studentStatus ?? null };
        });
      return {
        class: { id: cls.id, name: cls.name, program: cls.program.name, scheduleDays: cls.scheduleDays, scheduleTime: cls.scheduleTime, room: cls.room },
        sessionFilled: students.some((st) => st.status),
        students,
      } as T;
    }

    if (m === "GET" && idPart === "rekap-presensi") {
      const classId = Number(rawPath.split("/")[3]);
      const month = query.get("month") ?? "";
      const cls = state.classes.find((c) => c.id === classId);
      if (!cls) throw new MockApiError("Kelas tidak ditemukan.", 404);
      const rows = state.attendances.filter((a) => a.classId === classId && a.sessionDate.slice(0, 7) === month);
      const sessionDates = Array.from(new Set(rows.map((a) => a.sessionDate.slice(0, 10)))).sort();
      const map = new Map<number, { id: number; noid: string; name: string; statuses: Record<string, string>; counts: { hadir: number; absen: number; izin: number; sakit: number } }>();
      for (const a of rows) {
        const st = state.students.find((x) => x.id === a.studentId);
        if (!st) continue;
        if (!map.has(st.id)) map.set(st.id, { id: st.id, noid: st.noid, name: st.name, statuses: {}, counts: { hadir: 0, absen: 0, izin: 0, sakit: 0 } });
        const row = map.get(st.id)!;
        row.statuses[a.sessionDate.slice(0, 10)] = a.studentStatus;
        if (a.studentStatus in row.counts) row.counts[a.studentStatus as keyof typeof row.counts] += 1;
      }
      return { class: { id: cls.id, name: cls.name, program: cls.program.name }, month, sessionDates, students: Array.from(map.values()) } as T;
    }
  }

  if (resource === "attendances" && idPart === "sesi" && m === "POST") {
    const classId = Number(payload.classId ?? payload.class_id);
    const sessionDate = String(payload.sessionDate ?? new Date().toISOString());
    const key = sessionDate.slice(0, 10);
    if (state.attendances.some((a) => a.classId === classId && a.sessionDate.slice(0, 10) === key)) {
      throw new MockApiError("Presensi kelas ini untuk tanggal tersebut sudah diisi.", 409);
    }
    const list = (payload.siswaPresensi ?? payload.siswa_presensi ?? []) as { studentId?: number; student_id?: number; status: string; score?: number | null; notes?: string | null }[];
    for (const s of list) {
      if (s.score !== null && s.score !== undefined && Number(s.score) < 60 && !s.notes?.trim()) {
        throw new MockApiError("Nilai di bawah 60 wajib disertai catatan guru.");
      }
    }
    let grades = 0;
    for (const s of list) {
      const sid = Number(s.studentId ?? s.student_id);
      state.attendances.push({
        id: state.nextAttendanceId++,
        classId,
        studentId: sid,
        sessionDate: new Date(sessionDate).toISOString(),
        studentStatus: s.status,
        teacherStatus: String(payload.teacherStatus ?? payload.teacher_status ?? "hadir"),
      });
      if (s.score !== null && s.score !== undefined) grades += 1;
    }
    return { message: `Sesi tersimpan: ${list.length} presensi, ${grades} nilai.`, attendances: list.length, grades, sessionDate } as T;
  }

  // ── RAPORT & KENAIKAN LEVEL (M6) ──
  if (resource === "report-cards") {
    if (m === "GET" && idPart === "student") {
      const sid = Number(rawPath.split("/")[3]);
      return { reports: state.reportCards.filter((r) => r.studentId === sid) } as T;
    }
    if (m === "GET" && idPart && rawPath.split("/")[3] === "pdf") {
      throw new MockApiError("PDF raport hanya tersedia saat terhubung ke backend.", 501);
    }
    if (m === "GET" && !idPart) {
      const classId = query.get("classId") ? Number(query.get("classId")) : null;
      const period = query.get("period");
      let rows = [...state.reportCards];
      if (classId) rows = rows.filter((r) => r.classId === classId);
      if (period) rows = rows.filter((r) => r.period === period);
      return { reports: rows } as T;
    }
    if (m === "POST" && !idPart) {
      const studentId = Number(payload.studentId ?? payload.student_id);
      const classId = Number(payload.classId ?? payload.class_id);
      const period = String(payload.period ?? "").trim();
      if (!/^\d{4}-S[12]$/.test(period)) throw new MockApiError("Format periode: YYYY-Sn (contoh 2026-S1)");
      if (state.reportCards.some((r) => r.studentId === studentId && r.classId === classId && r.period === period)) {
        throw new MockApiError(`Raport peserta untuk periode ${period} sudah ada.`, 409);
      }
      const cls = state.classes.find((c) => c.id === classId);
      const report = {
        id: state.nextReportId++,
        studentId,
        classId,
        period,
        finalScore: Number(payload.finalScore ?? payload.final_score ?? 0),
        teacherNotes: payload.teacherNotes ? String(payload.teacherNotes) : null,
        levelRecommendation: payload.levelRecommendation ? String(payload.levelRecommendation) : null,
        issuedAt: new Date().toISOString(),
        class: { id: classId, name: cls?.name ?? "-" },
      };
      state.reportCards.push(report);
      return { report, message: "Raport berhasil disimpan." } as T;
    }
  }

  if (resource === "students" && id && action === "kenaikan-level" && m === "POST") {
    const student = state.students.find((s) => s.id === id);
    if (!student) throw new MockApiError("Peserta tidak ditemukan.", 404);
    const enrollment = student.enrollments[0];
    if (!enrollment) throw new MockApiError("Peserta belum terdaftar di kelas aktif mana pun.");
    if (state.levelRequests.some((r) => r.studentId === id && r.status === "pending")) {
      throw new MockApiError("Sudah ada pengajuan kenaikan level yang menunggu persetujuan.", 409);
    }
    const request = {
      id: state.nextLevelReqId++,
      studentId: id,
      classId: enrollment.class.id,
      fromLevel: "Level 1",
      toLevel: String(payload.levelBaru ?? payload.level_baru ?? ""),
      notes: payload.catatan ? String(payload.catatan) : null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    state.levelRequests.unshift(request);
    return { request, message: "Pengajuan kenaikan level terkirim ke admin." } as T;
  }

  if (resource === "kenaikan-level") {
    if (m === "GET" && !idPart) {
      const status = query.get("status");
      const rows = state.levelRequests
        .filter((r) => (status ? r.status === status : true))
        .map((r) => {
          const st = state.students.find((x) => x.id === r.studentId);
          const cls = state.classes.find((c) => c.id === r.classId);
          return {
            ...r,
            student: st ? { id: st.id, noid: st.noid, name: st.name } : null,
            class: cls ? { id: cls.id, name: cls.name, program: { name: cls.program.name } } : null,
          };
        });
      return { requests: rows } as T;
    }
    if (m === "PUT" && id && action === "approve") {
      const req2 = state.levelRequests.find((r) => r.id === id);
      if (!req2) throw new MockApiError("Pengajuan tidak ditemukan.", 404);
      if (req2.status !== "pending") throw new MockApiError("Pengajuan ini sudah diproses.", 409);
      req2.status = "approved";
      return { request: req2, message: "Kenaikan level disetujui dan WA #5 dicatat." } as T;
    }
    if (m === "PUT" && id && action === "reject") {
      const req2 = state.levelRequests.find((r) => r.id === id);
      if (!req2) throw new MockApiError("Pengajuan tidak ditemukan.", 404);
      if (req2.status !== "pending") throw new MockApiError("Pengajuan ini sudah diproses.", 409);
      req2.status = "rejected";
      return { request: req2, message: "Pengajuan kenaikan level ditolak." } as T;
    }
  }

  throw new MockApiError(`Endpoint mock tidak dikenal: ${m} ${path}`, 404);
}
