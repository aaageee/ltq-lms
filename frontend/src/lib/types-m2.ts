// Tipe data M2 (program, kelas, guru) — bentuk mengikuti respons API backend

export interface Program {
  id: number;
  name: string;
  isActive: boolean;
  _count?: { classes: number };
}

export interface TeacherClass {
  id: number;
  name: string;
}

export interface Teacher {
  id: number;
  name: string;
  whatsapp: string;
  specialization: string | null;
  email: string;
  isActive: boolean;
  classes: TeacherClass[];
}

export interface ClassRow {
  id: number;
  name: string;
  programId: number;
  program: { id: number; name: string };
  teacherId: number | null;
  teacher: { id: number; name: string } | null;
  capacity: number;
  filled: number;
  scheduleDays: string;
  scheduleTime: string;
  room: string | null;
  isActive: boolean;
}

export interface ApiList<T> {
  [key: string]: T[] | undefined;
}
