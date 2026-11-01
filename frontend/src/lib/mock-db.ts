// Mock database in-memory untuk MODE PREVIEW (NEXT_PUBLIC_DEV_MODE=true).
// Dipakai di build GitHub Pages agar CRUD tetap bisa dicoba tanpa backend.
// Data kembali ke seed saat halaman di-reload.

import type { ClassRow, Program, Teacher } from "./types-m2";

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
  nextProgramId: number;
  nextTeacherId: number;
  nextClassId: number;
}

function seed(): MockState {
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
    { id: 1, name: "Kelas Tahsin A", programId: 1, program: { id: 1, name: "Tahsin" }, teacherId: 1, teacher: { id: 1, name: "Ust. Abdul Karim" }, capacity: 15, filled: 12, scheduleDays: "Senin,Rabu", scheduleTime: "09:00-10:00", room: "Ruang 1", isActive: true },
    { id: 2, name: "Kelas Tahsin B", programId: 1, program: { id: 1, name: "Tahsin" }, teacherId: 1, teacher: { id: 1, name: "Ust. Abdul Karim" }, capacity: 16, filled: 16, scheduleDays: "Selasa,Kamis", scheduleTime: "14:00-15:00", room: "Ruang 2", isActive: true },
    { id: 3, name: "Kelas Tartil A", programId: 2, program: { id: 2, name: "Tartil" }, teacherId: 2, teacher: { id: 2, name: "Ust. Ibrahim" }, capacity: 12, filled: 8, scheduleDays: "Senin,Kamis", scheduleTime: "10:00-11:00", room: "Ruang 3", isActive: true },
    { id: 4, name: "Kelas Tartil B", programId: 2, program: { id: 2, name: "Tartil" }, teacherId: 2, teacher: { id: 2, name: "Ust. Ibrahim" }, capacity: 12, filled: 10, scheduleDays: "Selasa,Jumat", scheduleTime: "14:00-15:00", room: "Ruang 3", isActive: true },
    { id: 5, name: "Kelas Talaqqi A", programId: 3, program: { id: 3, name: "Talaqqi" }, teacherId: 3, teacher: { id: 3, name: "Ust. Hamzah" }, capacity: 10, filled: 6, scheduleDays: "Rabu", scheduleTime: "13:00-14:30", room: "Ruang 4", isActive: true },
    { id: 6, name: "Kelas Tahsin C", programId: 1, program: { id: 1, name: "Tahsin" }, teacherId: null, teacher: null, capacity: 15, filled: 0, scheduleDays: "Sabtu", scheduleTime: "08:00-09:00", room: "Ruang 1", isActive: true },
  ];

  // isi kelas yang diajar per guru
  for (const t of teachers) {
    t.classes = classes
      .filter((c) => c.teacherId === t.id && c.isActive)
      .map((c) => ({ id: c.id, name: c.name }));
  }

  return { programs, teachers, classes, nextProgramId: 4, nextTeacherId: 5, nextClassId: 7 };
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

// Router mock: meniru endpoint backend
export async function mockRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 250)); // simulasi latensi jaringan

  const m = method.toUpperCase();
  const [, resource, idPart] = path.split("?")[0].split("/"); // ["", "programs", "1"]
  const id = idPart ? Number(idPart) : null;
  const payload = (body ?? {}) as Record<string, unknown>;

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
        // bersihkan relasi lama
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

  throw new MockApiError(`Endpoint mock tidak dikenal: ${m} ${path}`, 404);
}
