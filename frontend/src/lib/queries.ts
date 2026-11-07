"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "./api";
import type { ClassRow, Program, Teacher } from "./types-m2";
import type { StudentDetail, StudentRow } from "./types-m3";
import type { InvoiceRow } from "./types-m4";

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

export function useStudent(id: number | null) {
  return useQuery({
    queryKey: ["student", id],
    enabled: !!id,
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
