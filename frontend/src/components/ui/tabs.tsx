"use client";

import { cn } from "@/lib/utils";

// Tabs sederhana gaya shadcn
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto border-b border-slate-200", className)}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
