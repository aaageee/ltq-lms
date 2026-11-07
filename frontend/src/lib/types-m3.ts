// Tipe data M3 — peserta (PSB)

export type StudentStatus = "active" | "inactive" | "cuti";

export interface StudentRow {
  id: number;
  noid: string;
  name: string;
  whatsapp: string;
  status: StudentStatus;
  photoUrl: string | null;
  programs: string[];
  classes: string[];
  teachers: (string | null)[];
  program: string | null;
  kelas: string | null;
  nama_guru: string | null;
  createdAt: string;
}

export interface StudentEnrollment {
  id: number;
  status: string;
  program: { id: number; name: string };
  class: {
    id: number;
    name: string;
    scheduleDays: string;
    scheduleTime: string;
    teacher: { id: number; name: string } | null;
  };
}

export interface StudentPayment {
  id: number;
  amount: number;
  confirmedAt: string | null;
  createdAt: string;
}

export interface StudentInvoice {
  id: number;
  period: string;
  components: { nama: string; jumlah: number }[];
  totalAmount: number;
  dueDate: string;
  status: string;
  createdAt: string;
  payments: StudentPayment[];
}

export interface StudentAttendance {
  id: number;
  sessionDate: string;
  studentStatus: string;
  teacherStatus: string;
  class: { name: string };
}

export interface StudentGrade {
  id: number;
  gradeType: string;
  score: number;
  notes: string | null;
  createdAt: string;
  class: { name: string };
}

export interface StudentDetail {
  id: number;
  noid: string;
  name: string;
  whatsapp: string;
  dob: string | null;
  gender: "L" | "P" | null;
  address: string | null;
  photoUrl: string | null;
  ktpUrl: string | null;
  parentName: string | null;
  parentPhone: string | null;
  status: StudentStatus;
  cutiStart: string | null;
  cutiEnd: string | null;
  cutiReason: string | null;
  createdAt?: string;
  enrollments: StudentEnrollment[];
  invoices: StudentInvoice[];
  attendances: StudentAttendance[];
  grades: StudentGrade[];
}
