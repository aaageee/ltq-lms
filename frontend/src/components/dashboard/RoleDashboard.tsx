"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Role } from "@/lib/types";

// Wrapper satu-role: cek auth + render DashboardLayout
export default function RoleDashboard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={[role]}>
      <DashboardLayout role={role}>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
