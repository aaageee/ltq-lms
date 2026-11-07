"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Drawer gaya shadcn (panel dari kanan) — dipakai form multi-step PSB
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClass = "sm:max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl",
          widthClass
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 p-4">{footer}</div>}
      </div>
    </div>
  );
}
