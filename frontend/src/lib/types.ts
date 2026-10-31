// Tipe global frontend

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN_CABANG"
  | "GURU"
  | "TU"
  | "BENDAHARA";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  branchId: number | null;
  nama: string;
}

// Label Indonesia per role (untuk badge, dst)
export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_CABANG: "Admin Cabang",
  GURU: "Guru",
  TU: "TU",
  BENDAHARA: "Bendahara",
};

// Redirect path setelah login, per role
export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  ADMIN_CABANG: "/dashboard/admin",
  GURU: "/dashboard/guru",
  TU: "/dashboard/tu",
  BENDAHARA: "/dashboard/bendahara",
};
