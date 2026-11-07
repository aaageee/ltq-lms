"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "./api";
import type { ClassRow, Program, Teacher } from "./types-m2";
import type { StudentDetail, StudentRow } from "./types-m3";
import type { InvoiceRow } from "./types-m4";
import type { CutiRow, JadwalKelas, KelasSiswaResponse, RekapResponse } from "./types-m5";

// ── PROGRAMS ──
export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: () => apiFetch<{ programs: Program[] }>("/programs"),
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiFetch<{ program: Program; message: string }>("/programs", { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; isActive?: boolean } }) =>
      apiFetch<{ program: Program; message: string }>(`/programs/${id}`, { method: "PUT", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["programs"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string }>(`/programs/${id}`, { method: "DELETE" }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── CLASSES ──
export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: () => apiFetch<{ classes: ClassRow[] }>("/classes"),
  });
}

export interface ClassPayload {
  name: string;
  programId: number;
  teacherId: number | null;
  capacity: number;
  scheduleDays: string;
  scheduleTime: string;
  room?: string | null;
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ClassPayload) =>
      apiFetch<{ class: ClassRow; message: string }>("/classes", { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["programs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<ClassPayload> & { isActive?: boolean } }) =>
      apiFetch<{ class: ClassRow; message: string }>(`/classes/${id}`, { method: "PUT", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<{ message: string }>(`/classes/${id}`, { method: "DELETE" }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── TEACHERS ──
export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: () => apiFetch<{ teachers: Teacher[] }>("/teachers"),
  });
}

export interface TeacherPayload {
  name: string;
  whatsapp: string;
  specialization?: string | null;
  email: string;
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TeacherPayload) =>
      apiFetch<{ teacher: Teacher; message: string }>("/teachers", { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message, { duration: 6000 });
      qc.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<TeacherPayload> & { isActive?: boolean } }) =>
      apiFetch<{ teacher: Teacher; message: string }>(`/teachers/${id}`, { method: "PUT", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch<{ message: string }>(`/teachers/${id}`, { method: "DELETE" }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── STUDENTS (M3) ──
export function useStudents(filters: { status?: string; programId?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return useQuery({
    queryKey: ["students", filters],
    queryFn: () => apiFetch<{ students: StudentRow[] }>(`/students${qs ? `?${qs}` : ""}`),
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: () => apiFetch<{ student: StudentDetail }>(`/students/${id}`),
  });
}

export interface StudentCreatePayload {
  name: string;
  whatsapp: string;
  dob?: string | null;
  gender?: "L" | "P" | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  programId: number;
  classId: number;
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StudentCreatePayload) =>
      apiFetch<{ student: StudentDetail; noid: string; sisaKuota: number; message: string }>(
        "/students",
        { method: "POST", body }
      ),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<StudentCreatePayload> }) =>
      apiFetch<{ student: StudentDetail; message: string }>(`/students/${id}`, { method: "PUT", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string }>(`/students/${id}/nonaktifkan`, { method: "POST" }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCutiStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { start: string; end: string; reason?: string } }) =>
      apiFetch<{ message: string }>(`/students/${id}/cuti`, { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadStudentFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, field, file }: { id: number; field: "foto" | "ktp"; file: File }) => {
      const fd = new FormData();
      fd.append(field, file);
      return apiFetch<{ student: StudentDetail; message: string }>(`/students/${id}/upload-${field}`, {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── INVOICES (M4) ──
export function useInvoices(filters: { status?: string; periode?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.periode) params.set("periode", filters.periode);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => apiFetch<{ invoices: InvoiceRow[] }>(`/invoices${qs ? `?${qs}` : ""}`),
  });
}

export function useTunggakan() {
  return useQuery({
    queryKey: ["tunggakan"],
    queryFn: () =>
      apiFetch<{ tunggakan: InvoiceRow[]; totalNominal: number; jumlah: number }>("/invoices/tunggakan"),
  });
}

export interface InvoiceCreatePayload {
  studentId: number;
  period: string;
  components: { nama: string; jumlah: number }[];
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InvoiceCreatePayload) =>
      apiFetch<{ invoice: InvoiceRow; message: string }>("/invoices", { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["tunggakan"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { amount: number; method?: string; proofUrl?: string | null } }) =>
      apiFetch<{ invoice: InvoiceRow; message: string }>(`/invoices/${id}/konfirmasi-bayar`, {
        method: "PUT",
        body,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["tunggakan"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alasan }: { id: number; alasan: string }) =>
      apiFetch<{ message: string }>(`/invoices/${id}/batalkan`, { method: "PUT", body: { alasan } }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["tunggakan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSendReminder() {
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string; preview: string }>(`/invoices/${id}/kirim-reminder`, { method: "POST" }),
    onSuccess: (data) => toast.success(data.message),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── GURU / KBM (M5) ──
export function useJadwalHariIni() {
  return useQuery({
    queryKey: ["guru", "jadwal-hari-ini"],
    queryFn: () => apiFetch<{ hari: string; kelas: JadwalKelas[] }>("/guru/jadwal-hari-ini"),
  });
}

export function useKelasGuru() {
  return useQuery({
    queryKey: ["guru", "kelas"],
    queryFn: () => apiFetch<{ classes: Omit<JadwalKelas, "hasSession">[] }>("/guru/kelas"),
  });
}

export function useKelasSiswa(classId: number) {
  return useQuery({
    queryKey: ["guru", "kelas-siswa", classId],
    queryFn: () => apiFetch<KelasSiswaResponse>(`/guru/kelas/${classId}/siswa`),
  });
}

export function useRekapPresensi(classId: number, month: string) {
  return useQuery({
    queryKey: ["guru", "rekap", classId, month],
    queryFn: () => apiFetch<RekapResponse>(`/guru/rekap-presensi/${classId}?month=${month}`),
  });
}

export interface SesiPayload {
  classId: number;
  teacherStatus: "hadir" | "badal";
  badalTeacherId?: number | null;
  siswaPresensi: { studentId: number; status: string; score?: number | null; notes?: string | null }[];
}

export function useSimpanSesi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SesiPayload) =>
      apiFetch<{ message: string; attendances: number; grades: number }>("/attendances/sesi", {
        method: "POST",
        body,
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["guru"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGuruLain() {
  return useQuery({
    queryKey: ["guru", "guru-lain"],
    queryFn: () => apiFetch<{ teachers: { id: number; name: string }[] }>("/guru/guru-lain"),
  });
}

export function useCutiList() {
  return useQuery({
    queryKey: ["guru", "cuti"],
    queryFn: () => apiFetch<{ leaves: CutiRow[] }>("/guru/cuti"),
  });
}

export function useAjukanCuti() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { start: string; end: string; reason?: string; badalTeacherId?: number | null }) =>
      apiFetch<{ message: string }>("/guru/cuti", { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["guru", "cuti"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── RAPORT & KENAIKAN LEVEL (M6) ──
export interface ReportRow {
  id: number;
  studentId: number;
  classId: number;
  period: string;
  finalScore: number | null;
  teacherNotes: string | null;
  levelRecommendation: string | null;
  issuedAt: string;
  class?: { id: number; name: string; program?: { name: string } };
}

export interface LevelRequestRow {
  id: number;
  studentId: number;
  classId: number;
  fromLevel: string | null;
  toLevel: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  student?: { id: number; noid: string; name: string };
  class?: { id: number; name: string; program: { name: string } };
}

export function useReportsByClass(classId: number, period: string) {
  return useQuery({
    queryKey: ["reports", "class", classId, period],
    queryFn: () => apiFetch<{ reports: ReportRow[] }>(`/report-cards?classId=${classId}&period=${period}`),
  });
}

export function useReportsByStudent(studentId: number) {
  return useQuery({
    queryKey: ["reports", "student", studentId],
    queryFn: () => apiFetch<{ reports: ReportRow[] }>(`/report-cards/student/${studentId}`),
  });
}

export function useSaveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      studentId: number;
      classId: number;
      period: string;
      finalScore: number;
      teacherNotes?: string | null;
      levelRecommendation?: string | null;
    }) => apiFetch<{ report: ReportRow; message: string }>("/report-cards", { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAjukanLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, body }: { studentId: number; body: { levelBaru: string; catatan?: string } }) =>
      apiFetch<{ message: string }>(`/students/${studentId}/kenaikan-level`, { method: "POST", body }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["levels"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useLevelRequests(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["levels", status ?? "all"],
    queryFn: () => apiFetch<{ requests: LevelRequestRow[] }>(`/kenaikan-level${qs}`),
  });
}

export function useApproveLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ message: string }>(`/kenaikan-level/${id}/approve`, { method: "PUT" }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["levels"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alasan }: { id: number; alasan?: string }) =>
      apiFetch<{ message: string }>(`/kenaikan-level/${id}/reject`, { method: "PUT", body: { alasan } }),
    onSuccess: (data) => {
      toast.success(data.message);
      qc.invalidateQueries({ queryKey: ["levels"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
