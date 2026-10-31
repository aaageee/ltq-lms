"use client";

import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// KPI card: ikon, label, nilai, sub-teks opsional
export default function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "primary",
  loading = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "secondary" | "amber" | "red";
  loading?: boolean;
}) {
  const accentBg = {
    primary: "bg-primary-light text-primary",
    secondary: "bg-secondary-light text-secondary-dark",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  }[accent];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accentBg)}>
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-24" />
          ) : (
            <p className="text-lg font-bold leading-tight text-slate-800 xl:text-xl">{value}</p>
          )}
          {sub && !loading && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
