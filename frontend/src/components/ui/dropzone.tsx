"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Dropzone upload (drag & drop / klik) dengan preview gambar
export function Dropzone({
  label,
  accept,
  hint,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function pick(f: File | null) {
    onChange(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={label} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-slate-400">
              <FileText size={22} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
            aria-label="Hapus file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pick(f);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed p-5 text-center transition-colors",
            dragging ? "border-primary bg-primary-light" : "border-slate-300 bg-white hover:border-primary/60"
          )}
        >
          <UploadCloud size={22} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Klik atau tarik file ke sini</span>
          <span className="text-[11px] text-slate-400">{hint}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
