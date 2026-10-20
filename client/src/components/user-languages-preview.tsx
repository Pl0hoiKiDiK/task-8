"use client";

import { useState, type FormEvent } from "react";
import { AppIcon } from "@/components/app-icon";
import { proficiencyDisplay, proficiencyOptions, useLanguagePreviewData, type LanguageProficiency, type ProfileLanguage } from "@/components/profile-languages-data";
import { useCvPreviewData } from "@/components/profile-cvs-data";
import { SkillDialog } from "@/components/skill-dialogs";
import { ProfileProficiencyItem, proficiencyBarClass } from "@/components/profile-proficiency-item";

export function UserLanguagesPreview({ canEdit = true }: { canEdit?: boolean }) {
  const { languages, languageOptions, optionsState, reloadOptions, addLanguage, updateLanguage, removeLanguages } = useLanguagePreviewData();
  const { loadState, reload } = useCvPreviewData();
  const [dialog, setDialog] = useState<"add" | "edit" | "remove" | null>(null);
  const [editing, setEditing] = useState<ProfileLanguage | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const shownLanguages = languages;

  function cancelSelection() {
    setSelecting(false);
    setSelected([]);
  }

  if (loadState === "loading" || optionsState === "loading") return <p role="status">Loading languages…</p>;
  if (loadState === "error" || optionsState === "error") return <div role="alert">Could not load languages. <button type="button" onClick={() => { void Promise.all([reload(), reloadOptions()]).catch(() => undefined); }}>Retry</button></div>;

  return <div>
    <section className="mx-auto mt-8 w-[min(900px,100%)] px-6 max-[900px]:pr-[19px] max-[900px]:pl-[25px] max-[600px]:px-0" aria-labelledby="current-languages-title">
      <div className="[&+*]:mt-8 [&>h1]:m-0 [&>h1]:text-base [&>h1]:leading-6 [&>h1]:tracking-[.15px] [&>h1]:text-[var(--text)]">
        <h1 id="current-languages-title">Current languages</h1>
        {shownLanguages.length ? <div className="mt-4 grid auto-rows-[48px] grid-cols-2 max-[600px]:grid-cols-1">
          {shownLanguages.map((language) => {
            const { tone, level } = proficiencyDisplay[language.proficiency];
            const isSelected = selected.includes(language.name);
            return canEdit ? <button type="button" key={language.name}
              className={`flex min-h-12 w-full min-w-0 items-center gap-4 border-0 bg-transparent pl-4 text-left text-base leading-6 tracking-[.15px] text-[#626262] hover:text-[var(--text)] max-[900px]:pl-2${isSelected ? " rounded bg-[var(--sidebar-active)] text-[var(--text)]" : ""}`}
              aria-label={`${language.name}, ${language.proficiency}${selecting ? isSelected ? ", selected" : ", not selected" : ", edit language"}`}
              aria-pressed={selecting ? isSelected : undefined}
              onClick={() => {
                if (selecting) setSelected((current) => current.includes(language.name) ? current.filter((name) => name !== language.name) : [...current, language.name]);
                else { setEditing(language); setDialog("edit"); }
              }}>
              <span className={proficiencyBarClass(tone, isSelected)} aria-hidden="true"><span style={{ width: `${level}%` }} /></span>
              <span className="min-w-0 truncate">{language.name}</span>
            </button> : <ProfileProficiencyItem key={language.name} name={language.name} tone={tone} level={level} />;
          })}
        </div> : <p className="mt-6 mb-0 text-base text-[var(--muted)]">No languages here</p>}
      </div>
      {canEdit && <div className="mt-6 flex justify-end gap-16 pr-6 max-[900px]:gap-6 max-[900px]:pr-0 max-[600px]:justify-between max-[600px]:gap-3 [&>button]:inline-flex [&>button]:h-12 [&>button]:w-40 [&>button]:items-center [&>button]:justify-center [&>button]:gap-2 [&>button]:rounded-3xl [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:whitespace-nowrap [&>button]:uppercase [&>button]:text-[var(--action-muted)] [&>button:last-child]:text-[var(--red)] [&>button:hover:not(:disabled)]:brightness-80 [&>button:disabled]:cursor-default [&>button:disabled]:opacity-45 max-[600px]:[&>button]:min-w-0 max-[600px]:[&>button]:flex-1">
        {selecting ? <>
          <button type="button" className="border border-[var(--border)] text-[var(--text)]" onClick={cancelSelection}>Cancel</button>
          <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:opacity-45" disabled={!selected.length} onClick={() => setDialog("remove")}>Remove <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] px-1 text-xs leading-none tracking-normal text-[var(--red)] normal-case">{selected.length}</span></button>
        </> : <>
          <button type="button" onClick={() => { setEditing(null); setDialog("add"); }}><AppIcon name="add-profile-item" />Add language</button>
          <button type="button" disabled={!shownLanguages.length} onClick={() => setSelecting(true)}><AppIcon name="delete" />Remove languages</button>
        </>}
      </div>}
    </section>
    {canEdit && (dialog === "add" || dialog === "edit") && <LanguageFormDialog kind={dialog} language={editing} existing={shownLanguages} options={languageOptions}
      onClose={() => setDialog(null)} onSave={dialog === "add" ? addLanguage : updateLanguage} />}
    {canEdit && dialog === "remove" && <LanguageRemoveDialog count={selected.length} onClose={() => setDialog(null)}
      onConfirm={() => removeLanguages(selected)} onSuccess={cancelSelection} />}
  </div>;
}

function LanguageFormDialog({ kind, language, existing, options, onClose, onSave }: {
  kind: "add" | "edit";
  language: ProfileLanguage | null;
  existing: ProfileLanguage[];
  options: string[];
  onClose: () => void;
  onSave: (language: ProfileLanguage) => void | Promise<void>;
}) {
  const [name, setName] = useState(language?.name ?? "");
  const [proficiency, setProficiency] = useState<LanguageProficiency | "">(language?.proficiency ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [proficiencyTouched, setProficiencyTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const duplicate = kind === "add" && existing.some((item) => item.name === name);
  const valid = Boolean(name && proficiency && !duplicate);
  const title = kind === "add" ? "Add language" : "Edit language";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave({ name, proficiency: proficiency as LanguageProficiency });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "Language already exists" ? caught.message
        : kind === "add" ? "Failed to add language. Please try again." : "Failed to update language. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <SkillDialog title={title} onClose={onClose}>
    <form className="mt-6 flex flex-col gap-9 [&>div:last-child]:-mt-2.5" onSubmit={save} noValidate>
      <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:text-[var(--muted)] [&>select]:h-12 [&>select]:w-full [&>select]:rounded-none [&>select]:border [&>select]:border-[var(--border)] [&>select]:bg-[var(--surface)] [&>select]:px-[11px] [&>select]:text-base [&>select]:text-[var(--text)] [&>select:disabled]:bg-[var(--sidebar-active)] [&>select:disabled]:text-[var(--muted)] [&>select[aria-invalid=true]]:border-[var(--red)]">
        <label htmlFor="language-dialog-name">Language</label>
        <select id="language-dialog-name" value={name} disabled={kind === "edit" || saving} required
          aria-invalid={Boolean((nameTouched && !name) || duplicate)}
          aria-describedby={duplicate || (nameTouched && !name) ? "language-dialog-name-error" : undefined}
          onChange={(event) => { setName(event.target.value); setNameTouched(true); setError(""); }}>
          {kind === "add" && <option value="">Language</option>}
          {language && <option value={language.name}>{language.name}</option>}
          {options.filter((option) => option !== language?.name).map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
        {(duplicate || (nameTouched && !name)) && <span id="language-dialog-name-error" className="mt-1 block text-xs leading-4 text-[var(--red)]">{duplicate ? "Language already exists" : "Language is required"}</span>}
      </div>
      <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:text-[var(--muted)] [&>select]:h-12 [&>select]:w-full [&>select]:rounded-none [&>select]:border [&>select]:border-[var(--border)] [&>select]:bg-[var(--surface)] [&>select]:px-[11px] [&>select]:text-base [&>select]:text-[var(--text)] [&>select:disabled]:bg-[var(--sidebar-active)] [&>select:disabled]:text-[var(--muted)] [&>select[aria-invalid=true]]:border-[var(--red)]">
        <label htmlFor="language-dialog-proficiency">Language proficiency</label>
        <select id="language-dialog-proficiency" value={proficiency} disabled={saving} required
          aria-invalid={proficiencyTouched && !proficiency}
          aria-describedby={proficiencyTouched && !proficiency ? "language-dialog-proficiency-error" : undefined}
          onChange={(event) => { setProficiency(event.target.value as LanguageProficiency | ""); setProficiencyTouched(true); setError(""); }}>
          <option value="">Language proficiency</option>
          {proficiencyOptions.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
        {proficiencyTouched && !proficiency && <span id="language-dialog-proficiency-error" className="mt-1 block text-xs leading-4 text-[var(--red)]">Language proficiency is required</span>}
      </div>
      {error && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{error}</p>}
      <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
        <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={!valid || saving}>{saving ? "Saving..." : kind === "add" ? "Add" : "Save"}</button>
      </div>
    </form>
  </SkillDialog>;
}

function LanguageRemoveDialog({ count, onClose, onConfirm, onSuccess }: { count: number; onClose: () => void; onConfirm: () => void | Promise<void>; onSuccess: () => void }) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!count || removing) return;
    setRemoving(true);
    setError("");
    try {
      await onConfirm();
      onClose();
      onSuccess();
    } catch {
      setError("Failed to remove languages. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  return <SkillDialog title="Remove language" onClose={onClose}>
    <p className="mt-6 mb-7 text-base leading-6 tracking-[.15px]">Are you sure you want to remove <strong>{count} {count === 1 ? "language" : "languages"}</strong>?</p>
    {error && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{error}</p>}
    <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
      <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={removing} onClick={onClose}>Cancel</button>
      <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={removing || !count} onClick={confirm}>{removing ? "Removing..." : "Confirm"}</button>
    </div>
  </SkillDialog>;
}
