"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "./api";
import type { ClassRow, Program, Teacher } from "./types-m2";

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
