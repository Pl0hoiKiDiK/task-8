"use client";

import { useState, type FormEvent } from "react";
import { AdminCatalogPage, type CatalogSort } from "@/components/admin-catalog-page";
import { SkillDialog } from "@/components/skill-dialogs";
import {
  filterAndSortLanguages,
  initialAdminLanguages,
  normalizeLanguageFields,
  validateLanguageFields,
  type AdminLanguage,
  type LanguageFields,
  type LanguageSort,
} from "@/components/admin-languages-data";

async function loadLanguagePreview(): Promise<AdminLanguage[]> {
  // Local catalog preview until the authenticated language API is connected.
  return [...initialAdminLanguages];
}

function sortLanguages(items: AdminLanguage[], search: string, sort: CatalogSort) {
  return filterAndSortLanguages(items, search, sort as LanguageSort);
}

export function AdminLanguagesPage() {
  return <AdminCatalogPage<AdminLanguage>
    singular="Language" plural="Languages" className="admin-languages"
    initialItems={[]} loadItems={loadLanguagePreview}
    columns={[
      { key: "name", label: "Name", sortable: true, render: (item) => item.name },
      { key: "iso", label: "ISO", sortable: true, render: (item) => item.iso },
      { key: "nativeName", label: "Native name", className: "admin-languages-native", render: (item) => item.nativeName },
    ]}
    filterAndSort={sortLanguages}
    renderDialog={({ dialog, actions }) => {
      if (dialog?.type === "create") return <AdminLanguageFormDialog key="create" languages={actions.items}
        onClose={actions.close} onSave={(fields) => actions.create({ id: crypto.randomUUID(), ...fields })} />;
      if (dialog?.type === "edit") return <AdminLanguageFormDialog key={dialog.item.id} language={dialog.item}
        languages={actions.items} onClose={actions.close}
        onSave={(fields) => actions.update({ ...dialog.item, ...fields })} />;
      if (dialog?.type === "delete") return <AdminLanguageDeleteDialog key={dialog.item.id} language={dialog.item}
        onClose={actions.close} onDelete={() => actions.remove(dialog.item.id)} />;
      return null;
    }}
  />;
}
function AdminLanguageFormDialog({ language, languages, onClose, onSave }: {
  language?: AdminLanguage;
  languages: AdminLanguage[];
  onClose: () => void;
  onSave: (fields: LanguageFields) => void | Promise<void>;
}) {
  const [fields, setFields] = useState<LanguageFields>({
    name: language?.name ?? "",
    iso: language?.iso ?? "",
    nativeName: language?.nativeName ?? "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof LanguageFields, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [systemError, setSystemError] = useState("");
  const errors = validateLanguageFields(fields, languages, language?.id);
  const valid = Object.keys(errors).length === 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ name: true, iso: true, nativeName: true });
    if (!valid || saving) return;
    setSaving(true);
    setSystemError("");
    try {
      await onSave(normalizeLanguageFields(fields));
      onClose();
    } catch {
      setSystemError(language ? "Failed to update language. Please try again." : "Failed to create language. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const fieldSettings: { key: keyof LanguageFields; label: string; placeholder: string }[] = [
    { key: "name", label: "Name", placeholder: "Name" },
    { key: "iso", label: "ISO", placeholder: "ISO" },
    { key: "nativeName", label: "Native name", placeholder: "Native name" },
  ];

  return <SkillDialog title={language ? "Edit language" : "Create language"} onClose={onClose}>
    <form className="admin-language-dialog-form" onSubmit={submit} noValidate>
      {fieldSettings.map(({ key, label, placeholder }) => {
        const error = touched[key] ? errors[key] : undefined;
        const inputId = `admin-language-${key}`;
        return <div className="admin-language-field" key={key}>
          <label htmlFor={inputId}>{label}</label>
          <input id={inputId} type="text" placeholder={placeholder} value={fields[key]} disabled={saving}
            maxLength={key === "iso" ? 5 : undefined} aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            onBlur={(event) => {
              if (event.relatedTarget instanceof HTMLElement && event.currentTarget.closest("dialog")?.contains(event.relatedTarget)) {
                setTouched((current) => ({ ...current, [key]: true }));
              }
            }}
            onChange={(event) => {
              const value = key === "iso" ? event.target.value.toUpperCase() : event.target.value;
              setFields((current) => ({ ...current, [key]: value }));
              setTouched((current) => ({ ...current, [key]: true }));
              setSystemError("");
            }} />
          {error && <span id={`${inputId}-error`} className="cv-skill-field-error">{error}</span>}
        </div>;
      })}
      {systemError && <p className="cv-skill-system-error" role="alert">{systemError}</p>}
      <div className="profile-cv-dialog-actions">
        <button type="button" className="profile-cv-dialog-cancel" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="profile-cv-dialog-submit" disabled={!valid || saving}>
          {saving ? "Saving..." : language ? "Save" : "Create"}
        </button>
      </div>
    </form>
  </SkillDialog>;
}

function AdminLanguageDeleteDialog({ language, onClose, onDelete }: {
  language: AdminLanguage;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete();
      onClose();
    } catch {
      setError("Failed to delete language. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return <SkillDialog title="Delete language" onClose={onClose}>
    <p className="profile-cv-dialog-message">Are you sure you want to delete language <strong>{language.name}</strong>?</p>
    {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
    <div className="profile-cv-dialog-actions">
      <button type="button" className="profile-cv-dialog-cancel" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="profile-cv-dialog-submit" disabled={deleting} onClick={confirm}>
        {deleting ? "Deleting..." : "Confirm"}
      </button>
    </div>
  </SkillDialog>;
}
