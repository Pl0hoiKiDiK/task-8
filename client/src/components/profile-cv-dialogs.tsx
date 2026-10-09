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
      className="profile-cv-dialog"
      aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      <div className="profile-cv-dialog-header">
        <h2>{title}</h2>
        <button type="button" className="profile-cv-dialog-close" aria-label={`Close ${title}`} onClick={onClose}>×</button>
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
      <label className="profile-cv-dialog-field" htmlFor={id} key={key}>
        <span className={cv ? "profile-cv-dialog-caption" : "sr-only"}>{label}</span>
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
        {error && <span id={`${id}-error`} className="profile-cv-field-error">{error}</span>}
      </label>
    );
  }

  return (
    <CvDialog title={title} onClose={onClose} initialFocus="#cv-name" returnFocus={cv ? `[data-cv-id="${cv.id}"]` : ".profile-cvs-create"}>
      <form className="profile-cv-dialog-form" onSubmit={save} noValidate>
        {field("name", "Name")}
        {field("education", "Education")}
        {field("description", "Description")}
        <div className="profile-cv-dialog-actions">
          <button className="profile-cv-dialog-cancel" type="button" onClick={onClose}>Cancel</button>
          <button className="profile-cv-dialog-submit" type="submit" disabled={!valid}>{cv ? saveLabel : "Create"}</button>
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
    <CvDialog title="Delete CV" onClose={onClose} initialFocus=".profile-cv-dialog-cancel" returnFocus={`[data-cv-id="${cv.id}"]`}>
      <p className="profile-cv-dialog-message">Are you sure you want to delete CV <strong>{cv.name}</strong>?</p>
      <div className="profile-cv-dialog-actions">
        <button className="profile-cv-dialog-cancel" type="button" onClick={onClose}>Cancel</button>
        <button className="profile-cv-dialog-submit" type="button" onClick={onConfirm}>Confirm</button>
      </div>
    </CvDialog>
  );
}
