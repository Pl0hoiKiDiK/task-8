"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { CvFields, CvRecord } from "@/components/profile-cvs-data";

function CvDialog({ title, onClose, children, initialFocus, returnFocus }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  initialFocus: string;
  returnFocus: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const frame = requestAnimationFrame(() => dialog.querySelector<HTMLElement>(initialFocus)?.focus());
    return () => {
      cancelAnimationFrame(frame);
      dialog.close();
      document.querySelector<HTMLElement>(returnFocus)?.focus();
    };
  }, [initialFocus, returnFocus]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(620px,calc(100vw_-_32px))] border-0 bg-[var(--dialog-surface)] px-6 py-4 text-[var(--text)] backdrop:bg-[var(--dialog-backdrop)]"
      aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      <div className="flex min-h-6 items-center justify-between [&>h2]:m-0 [&>h2]:text-xl [&>h2]:font-medium [&>h2]:leading-6">
        <h2>{title}</h2>
        <button type="button" className="grid size-6 place-items-center border-0 bg-transparent p-0 text-[27px] font-light leading-6 text-[var(--text)]" aria-label={`Close ${title}`} onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}

const emptyFields: CvFields = { name: "", education: "", description: "" };

function validate(fields: CvFields) {
  return {
    name: fields.name.trim() ? "" : "Name is required",
    education: fields.education.trim() ? "" : "Education is required",
    description: fields.description.trim() ? "" : "Description is required",
  };
}

export function CvFormDialog({ cv, onClose, onSave, saveLabel = "Update" }: {
  cv?: CvRecord;
  onClose: () => void;
  onSave: (fields: CvFields) => void;
  saveLabel?: string;
}) {
  const [fields, setFields] = useState<CvFields>(cv ? {
    name: cv.name, education: cv.education, description: cv.description,
  } : emptyFields);
  const [touched, setTouched] = useState<Record<keyof CvFields, boolean>>({
    name: false, education: false, description: false,
  });
  const errors = validate(fields);
  const valid = !errors.name && !errors.education && !errors.description;
  const title = cv ? "Update CV" : "Create CV";

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) {
      setTouched({ name: true, education: true, description: true });
      return;
    }
    onSave({
      name: fields.name.trim(),
      education: fields.education.trim(),
      description: fields.description.trim(),
    });
  }

  function field<K extends keyof CvFields>(key: K, label: string) {
    const error = touched[key] && errors[key];
    const id = `cv-${key}`;
    return (
      <label className="relative block [&>input]:block [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[#aeaeae] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-sm [&>input]:leading-6 [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:placeholder:text-[var(--placeholder)] [&>textarea]:block [&>textarea]:h-[172px] [&>textarea]:w-full [&>textarea]:resize-y [&>textarea]:rounded-none [&>textarea]:border [&>textarea]:border-[#aeaeae] [&>textarea]:bg-transparent [&>textarea]:px-[11px] [&>textarea]:pt-[11px] [&>textarea]:text-sm [&>textarea]:leading-6 [&>textarea]:tracking-[.15px] [&>textarea]:text-[var(--text)] [&>textarea]:placeholder:text-[var(--placeholder)] [&>[aria-invalid=true]]:border-[var(--red)]" htmlFor={id} key={key}>
        <span className={cv ? "absolute -top-[17px] left-3 text-xs leading-4 text-[var(--muted)]" : "sr-only"}>{label}</span>
        {key === "description" ? (
          <textarea
            id={id}
            name={key}
            value={fields[key]}
            placeholder={cv ? undefined : label}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))}
            onBlur={() => setTouched((current) => ({ ...current, [key]: true }))}
          />
        ) : (
          <input
            id={id}
            name={key}
            type="text"
            maxLength={255}
            value={fields[key]}
            placeholder={cv ? undefined : label}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))}
            onBlur={() => setTouched((current) => ({ ...current, [key]: true }))}
          />
        )}
        {error && <span id={`${id}-error`} className="static mt-1 block text-xs leading-4 text-[var(--red)]">{error}</span>}
      </label>
    );
  }

  return (
    <CvDialog title={title} onClose={onClose} initialFocus="#cv-name" returnFocus={cv ? `[data-cv-id="${cv.id}"]` : '[aria-label="Create CV"]'}>
      <form className="mt-[22px] grid gap-9" onSubmit={save} noValidate>
        {field("name", "Name")}
        {field("education", "Education")}
        {field("description", "Description")}
        <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
          <button className="border border-[var(--text)] bg-transparent text-[var(--text)]" type="button" onClick={onClose}>Cancel</button>
          <button className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" type="submit" disabled={!valid}>{cv ? saveLabel : "Create"}</button>
        </div>
      </form>
    </CvDialog>
  );
}

export function CvDeleteDialog({ cv, onClose, onConfirm }: {
  cv: CvRecord;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <CvDialog title="Delete CV" onClose={onClose} initialFocus="button:not([aria-label])" returnFocus={`[data-cv-id="${cv.id}"]`}>
      <p className="mt-6 mb-7 text-base leading-6 tracking-[.15px]">Are you sure you want to delete CV <strong>{cv.name}</strong>?</p>
      <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
        <button className="border border-[var(--text)] bg-transparent text-[var(--text)]" type="button" onClick={onClose}>Cancel</button>
        <button className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" type="button" onClick={onConfirm}>Confirm</button>
      </div>
    </CvDialog>
  );
}
