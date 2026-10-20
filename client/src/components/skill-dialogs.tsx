"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { masteryOptions, type CvSkill, type SkillMastery } from "@/components/cv-skills-data";

export function SkillDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    opener.current = document.activeElement as HTMLElement;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), button:not([aria-label]):not(:disabled)")?.focus();
    return () => {
      dialog.close();
      opener.current?.focus();
    };
  }, []);

  return (
    <dialog ref={ref} className="m-auto max-h-[calc(100dvh-32px)] w-[min(620px,calc(100vw_-_32px))] border-0 bg-[var(--dialog-surface)] px-6 py-4 text-[var(--text)] backdrop:bg-[var(--dialog-backdrop)]" aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="flex min-h-6 items-center justify-between [&>h2]:m-0 [&>h2]:text-xl [&>h2]:font-medium [&>h2]:leading-6">
        <h2>{title}</h2>
        <button type="button" className="grid size-6 place-items-center border-0 bg-transparent p-0 text-[27px] font-light leading-6 text-[var(--text)]" aria-label={`Close ${title}`} onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}

export function SkillFormDialog({ kind, skill, available, onClose, onSave }: {
  kind: "add" | "update";
  skill?: CvSkill;
  available: CvSkill[];
  onClose: () => void;
  onSave: (name: string, mastery: SkillMastery) => void | Promise<void>;
}) {
  const [name, setName] = useState(skill?.name ?? "");
  const [mastery, setMastery] = useState<SkillMastery | "">(skill?.mastery ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [masteryTouched, setMasteryTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const valid = Boolean(name && mastery);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || saving) { setNameTouched(true); setMasteryTouched(true); return; }
    setSaving(true);
    setError("");
    try {
      await onSave(name, mastery as SkillMastery);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "Skill already exists"
        ? "Skill already exists"
        : kind === "add" ? "Failed to add skill. Please try again." : "Failed to update skill. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SkillDialog title={kind === "add" ? "Add skill" : "Update skill"} onClose={onClose}>
      <form className="mt-6 flex flex-col gap-9 [&>div:last-child]:-mt-2.5" onSubmit={save} noValidate>
        <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:text-[var(--muted)] [&>select]:h-12 [&>select]:w-full [&>select]:rounded-none [&>select]:border [&>select]:border-[var(--border)] [&>select]:bg-[var(--surface)] [&>select]:px-[11px] [&>select]:text-base [&>select]:text-[var(--text)] [&>select:disabled]:bg-[var(--sidebar-active)] [&>select:disabled]:text-[var(--muted)] [&>select[aria-invalid=true]]:border-[var(--red)]">
          <label htmlFor="skill-dialog-name">Skill</label>
          <select id="skill-dialog-name" value={name} disabled={kind === "update" || saving}
            aria-invalid={nameTouched && !name} aria-describedby={nameTouched && !name ? "skill-dialog-name-error" : undefined}
            onChange={(event) => { setName(event.target.value); setNameTouched(true); setError(""); }}>
            {kind === "add" && <option value="">Skill</option>}
            {skill && <option value={skill.name}>{skill.name}</option>}
            {available.map((item) => <option value={item.name} key={item.name}>{item.name}</option>)}
          </select>
          {nameTouched && !name && <span id="skill-dialog-name-error" className="mt-1 block text-xs leading-4 text-[var(--red)]">Skill is required</span>}
        </div>
        <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:text-[var(--muted)] [&>select]:h-12 [&>select]:w-full [&>select]:rounded-none [&>select]:border [&>select]:border-[var(--border)] [&>select]:bg-[var(--surface)] [&>select]:px-[11px] [&>select]:text-base [&>select]:text-[var(--text)] [&>select:disabled]:bg-[var(--sidebar-active)] [&>select:disabled]:text-[var(--muted)] [&>select[aria-invalid=true]]:border-[var(--red)]">
          <label htmlFor="skill-dialog-mastery">Skill mastery</label>
          <select id="skill-dialog-mastery" value={mastery} disabled={saving}
            aria-invalid={masteryTouched && !mastery} aria-describedby={masteryTouched && !mastery ? "skill-dialog-mastery-error" : undefined}
            onChange={(event) => { setMastery(event.target.value as SkillMastery | ""); setMasteryTouched(true); setError(""); }}>
            <option value="">Skill mastery</option>
            {masteryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          {masteryTouched && !mastery && <span id="skill-dialog-mastery-error" className="mt-1 block text-xs leading-4 text-[var(--red)]">Skill mastery is required</span>}
        </div>
        {error && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{error}</p>}
        <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
          <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={!valid || saving}>{saving ? "Saving..." : kind === "add" ? "Add" : "Update"}</button>
        </div>
      </form>
    </SkillDialog>
  );
}

export function SkillRemoveDialog({ count, error, title = "Remove skills", onClose, onConfirm, onSuccess }: {
  count: number;
  error: string;
  title?: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  onSuccess?: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [requestError, setRequestError] = useState("");

  async function confirm() {
    if (!count || removing) return;
    setRemoving(true);
    setRequestError("");
    try {
      await onConfirm();
      onClose();
      onSuccess?.();
    } catch {
      setRequestError("Failed to remove skills. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <SkillDialog title={title} onClose={onClose}>
      <p className="mt-6 mb-7 text-base leading-6 tracking-[.15px]">Are you sure you want to remove <strong>{count} {count === 1 ? "skill" : "skills"}</strong>?</p>
      {(error || requestError) && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{error || requestError}</p>}
      <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
        <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={removing} onClick={onClose}>Cancel</button>
        <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={removing || !count} onClick={confirm}>{removing ? "Removing..." : "Confirm"}</button>
      </div>
    </SkillDialog>
  );
}
