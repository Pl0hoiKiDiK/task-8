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
    singular="Language" plural="Languages" layout="wide"
    initialItems={[]} loadItems={loadLanguagePreview}
    columns={[
      { key: "name", label: "Name", sortable: true, render: (item) => item.name },
      { key: "iso", label: "ISO", sortable: true, render: (item) => item.iso },
      { key: "nativeName", label: "Native name", className: "max-[900px]:hidden", render: (item) => item.nativeName },
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
    <form className="mt-6 flex flex-col gap-9 [&>div:last-child]:-mt-2.5" onSubmit={submit} noValidate>
      {fieldSettings.map(({ key, label, placeholder }) => {
        const error = touched[key] ? errors[key] : undefined;
        const inputId = `admin-language-${key}`;
        return <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:leading-4 [&>label]:text-[var(--muted)] [&>input]:block [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[var(--border)] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-sm [&>input]:leading-6 [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:placeholder:text-[var(--placeholder)] [&>[aria-invalid=true]]:border-[var(--red)]" key={key}>
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
          {error && <span id={`${inputId}-error`} className="mt-1 block text-xs leading-4 text-[var(--red)]">{error}</span>}
        </div>;
      })}
      {systemError && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{systemError}</p>}
      <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
        <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={!valid || saving}>
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
    <p className="mt-6 mb-7 text-base leading-6 tracking-[.15px]">Are you sure you want to delete language <strong>{language.name}</strong>?</p>
    {error && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{error}</p>}
    <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
      <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={deleting} onClick={confirm}>
        {deleting ? "Deleting..." : "Confirm"}
      </button>
    </div>
  </SkillDialog>;
}
