"use client";

import { useState, type FormEvent } from "react";
import { AppIcon } from "@/components/app-icon";
import { languageOptions, proficiencyDisplay, proficiencyOptions, useLanguagePreviewData, type LanguageProficiency, type ProfileLanguage } from "@/components/profile-languages-data";
import { SkillDialog } from "@/components/skill-dialogs";

export function UserLanguagesPreview() {
  const { languages, addLanguage, updateLanguage, removeLanguages } = useLanguagePreviewData();
  const [dialog, setDialog] = useState<"add" | "edit" | "remove" | null>(null);
  const [editing, setEditing] = useState<ProfileLanguage | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const shownLanguages = languages;

  function cancelSelection() {
    setSelecting(false);
    setSelected([]);
  }

  return <div className="user-languages-page">
    <section className="user-skills-content user-languages-content" aria-labelledby="current-languages-title">
      <div className="user-skills-group">
        <h1 id="current-languages-title">Current languages</h1>
        {shownLanguages.length ? <div className="user-skills-grid user-languages-grid">
          {shownLanguages.map((language) => {
            const { tone, level } = proficiencyDisplay[language.proficiency];
            const isSelected = selected.includes(language.name);
            return <button type="button" key={language.name}
              className={`user-skill user-skill--button user-language${isSelected ? " user-skill--selected" : ""}`}
              aria-label={`${language.name}, ${language.proficiency}${selecting ? isSelected ? ", selected" : ", not selected" : ", edit language"}`}
              aria-pressed={selecting ? isSelected : undefined}
              onClick={() => {
                if (selecting) setSelected((current) => current.includes(language.name) ? current.filter((name) => name !== language.name) : [...current, language.name]);
                else { setEditing(language); setDialog("edit"); }
              }}>
              <span className={`user-skill-bar user-skill-bar--${tone}`} aria-hidden="true"><span style={{ width: `${level}%` }} /></span>
              <span className="user-language-name">{language.name}</span>
            </button>;
          })}
        </div> : <p className="user-languages-empty">No languages here</p>}
      </div>
      <div className="admin-profile-actions profile-skills-actions user-languages-actions">
        {selecting ? <>
          <button type="button" className="profile-skills-cancel" onClick={cancelSelection}>Cancel</button>
          <button type="button" className="profile-skills-remove" disabled={!selected.length} onClick={() => setDialog("remove")}>Remove <span className="cv-skills-count">{selected.length}</span></button>
        </> : <>
          <button type="button" onClick={() => { setEditing(null); setDialog("add"); }}><AppIcon name="add-profile-item" />Add language</button>
          <button type="button" disabled={!shownLanguages.length} onClick={() => setSelecting(true)}><AppIcon name="delete" />Remove languages</button>
        </>}
      </div>
    </section>
    {(dialog === "add" || dialog === "edit") && <LanguageFormDialog kind={dialog} language={editing} existing={shownLanguages}
      onClose={() => setDialog(null)} onSave={dialog === "add" ? addLanguage : updateLanguage} />}
    {dialog === "remove" && <LanguageRemoveDialog count={selected.length} onClose={() => setDialog(null)}
      onConfirm={() => removeLanguages(selected)} onSuccess={cancelSelection} />}
  </div>;
}

function LanguageFormDialog({ kind, language, existing, onClose, onSave }: {
  kind: "add" | "edit";
  language: ProfileLanguage | null;
  existing: ProfileLanguage[];
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
    <form className="cv-skill-dialog-form" onSubmit={save} noValidate>
      <div className="cv-skill-dialog-field">
        <label htmlFor="language-dialog-name">Language</label>
        <select id="language-dialog-name" value={name} disabled={kind === "edit" || saving} required
          aria-invalid={Boolean((nameTouched && !name) || duplicate)}
          aria-describedby={duplicate || (nameTouched && !name) ? "language-dialog-name-error" : undefined}
          onChange={(event) => { setName(event.target.value); setNameTouched(true); setError(""); }}>
          {kind === "add" && <option value="">Language</option>}
          {language && <option value={language.name}>{language.name}</option>}
          {languageOptions.filter((option) => option !== language?.name).map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
        {(duplicate || (nameTouched && !name)) && <span id="language-dialog-name-error" className="cv-skill-field-error">{duplicate ? "Language already exists" : "Language is required"}</span>}
      </div>
      <div className="cv-skill-dialog-field">
        <label htmlFor="language-dialog-proficiency">Language proficiency</label>
        <select id="language-dialog-proficiency" value={proficiency} disabled={saving} required
          aria-invalid={proficiencyTouched && !proficiency}
          aria-describedby={proficiencyTouched && !proficiency ? "language-dialog-proficiency-error" : undefined}
          onChange={(event) => { setProficiency(event.target.value as LanguageProficiency | ""); setProficiencyTouched(true); setError(""); }}>
          <option value="">Language proficiency</option>
          {proficiencyOptions.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
        {proficiencyTouched && !proficiency && <span id="language-dialog-proficiency-error" className="cv-skill-field-error">Language proficiency is required</span>}
      </div>
      {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
      <div className="profile-cv-dialog-actions">
        <button type="button" className="profile-cv-dialog-cancel" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="profile-cv-dialog-submit" disabled={!valid || saving}>{saving ? "Saving..." : kind === "add" ? "Add" : "Save"}</button>
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
    <p className="profile-cv-dialog-message">Are you sure you want to remove <strong>{count} {count === 1 ? "language" : "languages"}</strong>?</p>
    {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
    <div className="profile-cv-dialog-actions">
      <button type="button" className="profile-cv-dialog-cancel" disabled={removing} onClick={onClose}>Cancel</button>
      <button type="button" className="profile-cv-dialog-submit" disabled={removing || !count} onClick={confirm}>{removing ? "Removing..." : "Confirm"}</button>
    </div>
  </SkillDialog>;
}
