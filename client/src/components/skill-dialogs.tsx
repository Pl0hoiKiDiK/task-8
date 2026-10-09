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
    dialog.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), .profile-cv-dialog-cancel")?.focus();
    return () => {
      dialog.close();
      opener.current?.focus();
    };
  }, []);

  return (
    <dialog ref={ref} className="profile-cv-dialog cv-skill-dialog" aria-label={title}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="profile-cv-dialog-header">
        <h2>{title}</h2>
        <button type="button" className="profile-cv-dialog-close" aria-label={`Close ${title}`} onClick={onClose}>×</button>
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
      <form className="cv-skill-dialog-form" onSubmit={save} noValidate>
        <div className="cv-skill-dialog-field">
          <label htmlFor="skill-dialog-name">Skill</label>
          <select id="skill-dialog-name" value={name} disabled={kind === "update" || saving}
            aria-invalid={nameTouched && !name} aria-describedby={nameTouched && !name ? "skill-dialog-name-error" : undefined}
            onChange={(event) => { setName(event.target.value); setNameTouched(true); setError(""); }}>
            {kind === "add" && <option value="">Skill</option>}
            {skill && <option value={skill.name}>{skill.name}</option>}
            {available.map((item) => <option value={item.name} key={item.name}>{item.name}</option>)}
          </select>
          {nameTouched && !name && <span id="skill-dialog-name-error" className="cv-skill-field-error">Skill is required</span>}
        </div>
        <div className="cv-skill-dialog-field">
          <label htmlFor="skill-dialog-mastery">Skill mastery</label>
          <select id="skill-dialog-mastery" value={mastery} disabled={saving}
            aria-invalid={masteryTouched && !mastery} aria-describedby={masteryTouched && !mastery ? "skill-dialog-mastery-error" : undefined}
            onChange={(event) => { setMastery(event.target.value as SkillMastery | ""); setMasteryTouched(true); setError(""); }}>
            <option value="">Skill mastery</option>
            {masteryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          {masteryTouched && !mastery && <span id="skill-dialog-mastery-error" className="cv-skill-field-error">Skill mastery is required</span>}
        </div>
        {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
        <div className="profile-cv-dialog-actions">
          <button type="button" className="profile-cv-dialog-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="profile-cv-dialog-submit" disabled={!valid || saving}>{saving ? "Saving..." : kind === "add" ? "Add" : "Update"}</button>
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
      <p className="profile-cv-dialog-message">Are you sure you want to remove <strong>{count} {count === 1 ? "skill" : "skills"}</strong>?</p>
      {(error || requestError) && <p className="cv-skill-system-error" role="alert">{error || requestError}</p>}
      <div className="profile-cv-dialog-actions">
        <button type="button" className="profile-cv-dialog-cancel" disabled={removing} onClick={onClose}>Cancel</button>
        <button type="button" className="profile-cv-dialog-submit" disabled={removing || !count} onClick={confirm}>{removing ? "Removing..." : "Confirm"}</button>
      </div>
    </SkillDialog>
  );
}
