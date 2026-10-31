import * as React from "react";
import { cn } from "@/lib/utils";

// Gaya shadcn/ui — Badge dengan varian warna

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary-light text-primary border-primary/20",
  secondary: "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-secondary-light text-secondary-dark border-secondary/30",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  outline: "border-slate-300 text-slate-600",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
