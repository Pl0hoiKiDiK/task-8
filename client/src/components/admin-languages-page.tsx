"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AppIcon } from "@/components/app-icon";
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

type DialogState = { type: "create" } | { type: "edit" | "delete"; language: AdminLanguage } | null;
type LoadState = "loading" | "ready" | "error";
const PAGE_SIZE = 10;

async function loadLanguagePreview(): Promise<AdminLanguage[]> {
  // Local catalog preview until the authenticated language API is connected.
  return [...initialAdminLanguages];
}

export function AdminLanguagesPage() {
  const [languages, setLanguages] = useState<AdminLanguage[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<LanguageSort>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const createTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    void loadLanguagePreview().then((items) => {
      if (!active) return;
      setLanguages(items);
      setLoadState("ready");
    }).catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
  }, []);

  function retryLoad() {
    setLoadState("loading");
    void loadLanguagePreview().then((items) => {
      setLanguages(items);
      setLoadState("ready");
    }).catch(() => setLoadState("error"));
  }

  const matchingLanguages = useMemo(
    () => filterAndSortLanguages(languages, search, sort),
    [languages, search, sort],
  );
  const pageCount = Math.ceil(matchingLanguages.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const visibleLanguages = matchingLanguages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!openMenuId) return;
    menuRoot.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRoot.current?.contains(event.target)) setOpenMenuId(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
        menuTrigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [openMenuId]);

  function toggleSort(field: "name" | "iso") {
    setSort((current) => ({
      field,
      direction: current?.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
    setOpenMenuId(null);
  }

  function openAction(type: "edit" | "delete", language: AdminLanguage) {
    setOpenMenuId(null);
    setDialog({ type, language });
  }

  function closeDialog() {
    setDialog(null);
    requestAnimationFrame(() => {
      if (menuTrigger.current?.isConnected) menuTrigger.current.focus();
      else createTrigger.current?.focus();
    });
  }

  function createLanguage(fields: LanguageFields) {
    const language = { id: crypto.randomUUID(), ...fields };
    setLanguages((current) => [...current, language]);
    setSearch("");
    setSort(null);
    setPage(Math.ceil((languages.length + 1) / PAGE_SIZE));
  }

  function updateLanguage(id: string, fields: LanguageFields) {
    const index = languages.findIndex((item) => item.id === id);
    setLanguages((current) => current.map((item) => item.id === id ? { ...item, ...fields } : item));
    setSearch("");
    setSort(null);
    setPage(Math.floor(Math.max(index, 0) / PAGE_SIZE) + 1);
  }

  return <section className="admin-languages-page" aria-label="Languages catalog">
    <div className="profile-cvs-toolbar admin-languages-toolbar">
      <label className="search-field profile-cvs-search">
        <AppIcon name="search" />
        <span className="sr-only">Search languages by name</span>
        <input type="search" placeholder="Search" value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); setOpenMenuId(null); }} />
      </label>
      <button type="button" ref={createTrigger} className="create-action profile-cvs-create"
        aria-label="Create language" onClick={() => { menuTrigger.current = null; setDialog({ type: "create" }); }}>
        <AppIcon name="plus" /><span>Create language</span>
      </button>
    </div>

    <div className="admin-languages-table" role="table" aria-label="Languages" aria-busy={loadState === "loading"}>
      <div className="admin-languages-row admin-languages-heading" role="row">
        {(["name", "iso"] as const).map((field) => <div key={field} role="columnheader"
          aria-sort={sort?.field === field ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>
          <button type="button" className="profile-cvs-sort"
            aria-label={`Sort by ${field === "iso" ? "ISO" : "name"}${sort?.field === field ? `, currently ${sort.direction === "asc" ? "ascending" : "descending"}` : ""}`}
            onClick={() => toggleSort(field)}>
            {field === "iso" ? "ISO" : "Name"}
            <AppIcon name="sort" className={sort?.field === field && sort.direction === "desc" ? "sort-indicator profile-cvs-sort--desc" : "sort-indicator"} />
          </button>
        </div>)}
        <span className="admin-languages-native" role="columnheader">Native name</span>
        <span role="columnheader"><span className="sr-only">Actions</span></span>
      </div>

      {loadState === "loading" ? <div className="admin-languages-state" role="row"><p role="cell" aria-live="polite">Loading languages…</p></div>
        : loadState === "error" ? <div className="admin-languages-state" role="row"><div role="cell">
          <p role="alert">Could not load languages.</p>
          <button type="button" onClick={retryLoad}>Retry</button>
        </div></div>
          : visibleLanguages.length === 0 ? <div className="admin-languages-state" role="row"><p role="cell">No languages found</p></div>
            : visibleLanguages.map((language) => <div className="admin-languages-row admin-languages-item" role="row" key={language.id}>
              <span role="cell">{language.name}</span>
              <span role="cell">{language.iso}</span>
              <span role="cell" className="admin-languages-native">{language.nativeName}</span>
              <div className="profile-cv-actions" role="cell" ref={openMenuId === language.id ? menuRoot : undefined}>
                <button type="button" className="profile-cv-more" aria-label={`Actions for ${language.name}`}
                  aria-haspopup="menu" aria-expanded={openMenuId === language.id}
                  onClick={(event) => { menuTrigger.current = event.currentTarget; setOpenMenuId((value) => value === language.id ? null : language.id); }}>
                  <AppIcon name="more" />
                </button>
                {openMenuId === language.id && <div className="profile-cv-actions-menu" role="menu" aria-label={`Actions for ${language.name}`}
                  onKeyDown={(event) => {
                    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                    const at = items.indexOf(document.activeElement as HTMLElement);
                    items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length]?.focus();
                  }}>
                  <button type="button" role="menuitem" onClick={() => openAction("edit", language)}>Edit</button>
                  <button type="button" role="menuitem" onClick={() => openAction("delete", language)}>Delete</button>
                </div>}
              </div>
            </div>)}
    </div>

    {loadState === "ready" && pageCount > 1 && <nav className="profile-cvs-pagination" aria-label="Language pages">
      <button type="button" disabled={currentPage === 1} aria-label="Previous page" onClick={() => setPage(currentPage - 1)}>‹</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number}
        aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined}
        onClick={() => { setPage(number); setOpenMenuId(null); }}>{number}</button>)}
      <button type="button" disabled={currentPage === pageCount} aria-label="Next page" onClick={() => setPage(currentPage + 1)}>›</button>
    </nav>}

    {dialog?.type === "create" && <AdminLanguageFormDialog languages={languages} onClose={closeDialog} onSave={createLanguage} />}
    {dialog?.type === "edit" && <AdminLanguageFormDialog language={dialog.language} languages={languages} onClose={closeDialog}
      onSave={(fields) => updateLanguage(dialog.language.id, fields)} />}
    {dialog?.type === "delete" && <AdminLanguageDeleteDialog language={dialog.language} onClose={closeDialog}
      onDelete={() => setLanguages((current) => current.filter((item) => item.id !== dialog.language.id))} />}
  </section>;
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
