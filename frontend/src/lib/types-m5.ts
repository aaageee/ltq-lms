// Tipe data M5 — KBM guru

export interface JadwalKelas {
  id: number;
  name: string;
  program: string;
  scheduleDays: string;
  scheduleTime: string;
  room: string | null;
  students: number;
  hasSession: boolean;
}

export interface KelasSiswaRow {
  id: number;
  noid: string;
  name: string;
  status: string | null;
}

export interface KelasSiswaResponse {
  class: {
    id: number;
    name: string;
    program: string;
    scheduleDays: string;
    scheduleTime: string;
    room: string | null;
  };
  sessionFilled: boolean;
  students: KelasSiswaRow[];
}

export interface RekapStudent {
  id: number;
  noid: string;
  name: string;
  statuses: Record<string, string>;
  counts: { hadir: number; absen: number; izin: number; sakit: number };
}

export interface RekapResponse {
  class: { id: number; name: string; program: string };
  month: string;
  sessionDates: string[];
  students: RekapStudent[];
}

export interface CutiRow {
  id: number;
  dateStart: string;
  dateEnd: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  badalTeacher: { id: number; name: string } | null;
  createdAt: string;
}
