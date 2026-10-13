"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AppIcon } from "@/components/app-icon";
import {
  filterAndSortCvProjects, formatProjectDate, projectCatalog, projectRoleOptions, validateCvProject,
  type CatalogProject, type CvProjectEntry, type CvProjectFields, type ProjectSortKey, type SortDirection,
} from "@/components/cv-projects-data";
import { useCvPreviewData, type CvRecord } from "@/components/profile-cvs-data";

type ActiveDialog = { kind: "add" } | { kind: "update" | "remove"; entry: CvProjectEntry } | null;
type ProjectField = "projectId" | "startDate" | "endDate" | "roles";

const fieldClass = "h-12 w-full min-w-0 border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--text)] placeholder:text-[var(--placeholder)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--red)] disabled:cursor-not-allowed disabled:bg-[var(--sidebar-active)] disabled:text-[var(--muted)] aria-invalid:border-[var(--red)]";
const secondaryButton = "h-12 min-w-40 rounded-full border border-[var(--text)] px-5 text-sm font-medium uppercase text-[var(--text)] hover:bg-[var(--sidebar-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)] disabled:opacity-50";
const primaryButton = "h-12 min-w-40 rounded-full bg-[var(--red)] px-5 text-sm font-medium uppercase text-white hover:brightness-110 active:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)] disabled:cursor-not-allowed disabled:opacity-50";
const emptyProjects: CvProjectEntry[] = [];

function ProjectModal({ title, onClose, children, initialFocus }: {
  title: string; onClose: () => void; children: ReactNode; initialFocus: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    opener.current = document.activeElement as HTMLElement;
    dialog.showModal();
    dialog.querySelector<HTMLElement>(initialFocus)?.focus();
    return () => {
      dialog.close();
      opener.current?.focus();
    };
  }, [initialFocus]);

  return (
    <dialog ref={dialogRef} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="m-auto max-h-[calc(100dvh-32px)] w-[min(860px,calc(100vw-32px))] overflow-y-auto border-0 bg-[var(--project-dialog-surface)] p-6 text-[var(--text)] shadow-xl backdrop:bg-black/60 max-[600px]:p-4">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-xl font-medium">{title}</h2>
        <button type="button" aria-label={`Close ${title}`} onClick={onClose} className="grid h-7 w-7 place-items-center text-2xl leading-none hover:text-[var(--red)]">×</button>
      </div>
      {children}
    </dialog>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="mt-1 block text-xs text-[var(--red)]" role="alert">{message}</span> : null;
}

function ProjectFormDialog({ kind, cvId, entry, assigned, onClose, onSave }: {
  kind: "add" | "update";
  cvId: string;
  entry?: CvProjectEntry;
  assigned: CvProjectEntry[];
  onClose: () => void;
  onSave: (cvId: string, fields: CvProjectFields) => void | Promise<void>;
}) {
  const [fields, setFields] = useState<CvProjectFields>(entry ?? {
    projectId: "", startDate: "", endDate: "", roles: [], responsibilities: [],
  });
  const [responsibilities, setResponsibilities] = useState(entry?.responsibilities.join(", ") ?? "");
  const [touched, setTouched] = useState<Partial<Record<ProjectField, boolean>>>({});
  const [rolesOpen, setRolesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState("");
  const project = projectCatalog.find((item) => item.id === fields.projectId);
  const errors = validateCvProject(fields, projectCatalog);
  const valid = Object.keys(errors).length === 0;
  const dirty = !entry || JSON.stringify(fields) !== JSON.stringify(entry);

  function errorFor(key: ProjectField) { return touched[key] ? errors[key] : undefined; }
  function selectProject(id: string) {
    const selected = projectCatalog.find((item) => item.id === id);
    setFields({ projectId: id, startDate: selected?.startDate ?? "", endDate: selected?.endDate ?? "", roles: [], responsibilities: [] });
    setResponsibilities("");
    setTouched((current) => ({ ...current, projectId: true }));
    setRequestError("");
  }
  function toggleRole(role: string) {
    setFields((current) => ({ ...current, roles: current.roles.includes(role) ? current.roles.filter((item) => item !== role) : [...current.roles, role] }));
    setTouched((current) => ({ ...current, roles: true }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ projectId: true, startDate: true, endDate: true, roles: true });
    if (!valid || !dirty || saving) return;
    setSaving(true);
    setRequestError("");
    try {
      await onSave(cvId, fields);
      onClose();
    } catch (error) {
      setRequestError(error instanceof Error && error.message === "Project already added"
        ? "Project already added to this CV"
        : `Failed to ${kind === "add" ? "add" : "update"} project. Please try again.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProjectModal title={kind === "add" ? "Add project" : "Update project"} onClose={onClose} initialFocus={kind === "add" ? "#cv-project-name" : "#cv-project-start"}>
      <form onSubmit={save} noValidate className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cv-project-name" className="mb-1 block text-xs text-[var(--muted)]">Name</label>
          <select id="cv-project-name" value={fields.projectId} disabled={kind === "update" || saving}
            aria-invalid={Boolean(errorFor("projectId"))} aria-describedby={errorFor("projectId") ? "cv-project-name-error" : undefined}
            className={fieldClass} onBlur={() => setTouched((current) => ({ ...current, projectId: true }))}
            onChange={(event) => selectProject(event.target.value)}>
            <option value="">Select a project</option>
            {projectCatalog.map((item) => <option key={item.id} value={item.id} disabled={kind === "add" && assigned.some((used) => used.projectId === item.id)}>{item.name}</option>)}
          </select>
          <FieldError id="cv-project-name-error" message={errorFor("projectId")} />
        </div>
        <div>
          <label htmlFor="cv-project-domain" className="mb-1 block text-xs text-[var(--muted)]">Domain</label>
          <input id="cv-project-domain" className={fieldClass} value={project?.domain ?? ""} disabled placeholder="Domain" />
        </div>
        <div>
          <label htmlFor="cv-project-start" className="mb-1 block text-xs text-[var(--muted)]">Start Date</label>
          <input id="cv-project-start" type="date" className={fieldClass} value={fields.startDate} disabled={saving}
            min={project?.startDate} max={project?.endDate ?? undefined}
            aria-invalid={Boolean(errorFor("startDate"))} aria-describedby={errorFor("startDate") ? "cv-project-start-error" : undefined}
            onBlur={() => setTouched((current) => ({ ...current, startDate: true }))}
            onChange={(event) => { setFields((current) => ({ ...current, startDate: event.target.value })); setRequestError(""); }} />
          <FieldError id="cv-project-start-error" message={errorFor("startDate")} />
        </div>
        <div>
          <label htmlFor="cv-project-end" className="mb-1 block text-xs text-[var(--muted)]">End Date</label>
          <input id="cv-project-end" type="date" className={fieldClass} value={fields.endDate} disabled={saving}
            min={fields.startDate || project?.startDate} max={project?.endDate ?? undefined}
            aria-invalid={Boolean(errorFor("endDate"))} aria-describedby={errorFor("endDate") ? "cv-project-end-error" : undefined}
            onBlur={() => setTouched((current) => ({ ...current, endDate: true }))}
            onChange={(event) => { setFields((current) => ({ ...current, endDate: event.target.value })); setRequestError(""); }} />
          <FieldError id="cv-project-end-error" message={errorFor("endDate")} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="cv-project-description" className="mb-1 block text-xs text-[var(--muted)]">Description</label>
          <textarea id="cv-project-description" className={`${fieldClass} h-28 resize-none py-2`} value={project?.description ?? ""} disabled placeholder="Description" />
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs text-[var(--muted)]">Environment</span>
          <div aria-label="Environment" className="flex min-h-12 flex-wrap items-center gap-2 border border-[var(--border)] bg-[var(--sidebar-active)] p-2 text-[var(--muted)]">
            {project?.environment.length ? project.environment.map((item) => <span key={item} className="rounded-full border border-[var(--border)] px-2 text-sm">{item}</span>) : <span className="text-sm">Environment</span>}
          </div>
        </div>
        <div className="relative sm:col-span-2" onKeyDownCapture={(event) => { if (event.key === "Escape" && rolesOpen) { event.preventDefault(); event.stopPropagation(); setRolesOpen(false); } }}>
          <span id="cv-project-roles-label" className="mb-1 block text-xs text-[var(--muted)]">Roles</span>
          <button type="button" id="cv-project-roles" disabled={saving} aria-labelledby="cv-project-roles-label cv-project-roles"
            aria-expanded={rolesOpen} aria-controls="cv-project-role-options" aria-describedby={errorFor("roles") ? "cv-project-roles-error" : undefined}
            className={`${fieldClass} flex items-center justify-between text-left`}
            onClick={() => { setRolesOpen((open) => !open); setTouched((current) => ({ ...current, roles: true })); }}>
            <span className={fields.roles.length ? "truncate" : "text-[var(--placeholder)]"}>{fields.roles.length ? fields.roles.join(", ") : "Select roles"}</span>
            <span aria-hidden="true">⌄</span>
          </button>
          {rolesOpen && <div id="cv-project-role-options" className="mt-1 max-h-48 w-full overflow-y-auto border border-[var(--border)] bg-[var(--project-dialog-surface)] p-2">
            {projectRoleOptions.map((role) => <label key={role} className="flex cursor-pointer items-center gap-3 px-2 py-1 text-sm hover:bg-[var(--sidebar-active)]">
              <input type="checkbox" checked={fields.roles.includes(role)} onChange={() => toggleRole(role)} className="accent-[var(--red)]" />{role}
            </label>)}
          </div>}
          <FieldError id="cv-project-roles-error" message={errorFor("roles")} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="cv-project-responsibilities" className="mb-1 block text-xs text-[var(--muted)]">Responsibilities</label>
          <textarea id="cv-project-responsibilities" className={`${fieldClass} h-16 resize-y py-2`} value={responsibilities} disabled={saving}
            placeholder="Separate responsibilities with commas or new lines"
            onChange={(event) => {
              const text = event.target.value;
              setResponsibilities(text);
              setFields((current) => ({ ...current, responsibilities: text.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean) }));
              setRequestError("");
            }} />
        </div>
        {requestError && <p role="alert" className="text-sm text-[var(--red)] sm:col-span-2">{requestError}</p>}
        <div className="flex flex-wrap justify-end gap-4 sm:col-span-2">
          <button type="button" className={secondaryButton} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className={primaryButton} disabled={!valid || !dirty || saving}>{saving ? "Saving..." : kind === "add" ? "Add" : "Save"}</button>
        </div>
      </form>
    </ProjectModal>
  );
}

function RemoveProjectDialog({ project, onClose, onConfirm }: {
  project: CatalogProject; onClose: () => void; onConfirm: () => void | Promise<void>;
}) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (removing) return;
    setRemoving(true);
    setError("");
    try { await onConfirm(); onClose(); }
    catch { setError("Failed to remove project. Please try again."); }
    finally { setRemoving(false); }
  }
  return <ProjectModal title="Remove CV project" onClose={onClose} initialFocus="#cv-project-remove-cancel">
    <p className="mb-8 text-base">Are you sure you want to remove project <strong>{project.name}</strong>?</p>
    {error && <p role="alert" className="mb-4 text-sm text-[var(--red)]">{error}</p>}
    <div className="flex flex-wrap justify-end gap-4">
      <button id="cv-project-remove-cancel" type="button" className={secondaryButton} onClick={onClose} disabled={removing}>Cancel</button>
      <button type="button" className={primaryButton} onClick={confirm} disabled={removing}>{removing ? "Removing..." : "Confirm"}</button>
    </div>
  </ProjectModal>;
}

export function CvProjectsPage({ cv }: { cv: CvRecord }) {
  const { cvProjects, addCvProject, updateCvProject, removeCvProject } = useCvPreviewData();
  const entries = cvProjects[cv.id] ?? emptyProjects;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<ProjectSortKey>("name");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const shown = useMemo(() => filterAndSortCvProjects(entries, projectCatalog, search, sortKey, direction), [entries, search, sortKey, direction]);

  useEffect(() => {
    if (!openMenu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && (menuRef.current?.contains(event.target) || menuButtonRef.current?.contains(event.target))) return;
      setOpenMenu(null);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      menuButtonRef.current?.focus();
      setOpenMenu(null);
    };
    const onViewportChange = () => setOpenMenu(null);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [openMenu]);

  function toggleMenu(projectId: string, button: HTMLButtonElement) {
    if (openMenu === projectId) { setOpenMenu(null); return; }
    const rect = button.getBoundingClientRect();
    const menuWidth = 128;
    const menuHeight = 88;
    setMenuPosition({
      top: rect.bottom + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight) : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    });
    setOpenMenu(projectId);
  }

  function sort(key: ProjectSortKey) {
    if (key === sortKey) setDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSortKey(key); setDirection("asc"); }
  }
  function sortButton(key: ProjectSortKey, label: string) {
    return <button type="button" onClick={() => sort(key)} aria-label={`Sort by ${label}, ${sortKey === key ? direction : "not sorted"}`}
      className="inline-flex items-center gap-1 text-left hover:text-[var(--red)]">
      {label}<AppIcon name="sort" className={`!h-4 !w-4 ${sortKey === key && direction === "desc" ? "rotate-180" : ""} ${sortKey === key ? "text-[var(--red)]" : ""}`} />
    </button>;
  }

  return <section aria-label="CV projects" className="mx-auto w-full max-w-[1190px] pt-2 text-[var(--text)]">
    <div className="mb-5 flex items-center justify-between gap-4">
      <label className="flex h-12 w-80 max-w-[calc(100%-60px)] items-center gap-2 rounded-full border border-[var(--border)] px-3 focus-within:border-[var(--red)]">
        <AppIcon name="search" className="shrink-0" />
        <span className="sr-only">Search CV projects by name or domain</span>
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search"
          className="h-full min-w-0 flex-1 border-0 bg-transparent !outline-none placeholder:text-[var(--placeholder)]" />
      </label>
      <button type="button" aria-label="Add project" onClick={() => setDialog({ kind: "add" })}
        className="flex min-h-11 items-center gap-3 px-2 text-sm font-medium uppercase text-[var(--red)] hover:underline active:opacity-70">
        <AppIcon name="plus" /><span className="max-[900px]:hidden">Add project</span>
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[590px] table-fixed border-collapse text-sm">
        <thead><tr className="border-b border-[var(--border)] text-left">
          <th scope="col" className="w-[49%] px-4 pb-5 font-medium lg:w-[30%]">{sortButton("name", "Name")}</th>
          <th scope="col" className="hidden px-4 pb-5 font-medium lg:table-cell lg:w-[25%]">Domain</th>
          <th scope="col" className="w-[22%] px-4 pb-5 font-medium lg:w-[20%]">{sortButton("startDate", "Start Date")}</th>
          <th scope="col" className="w-[22%] px-4 pb-5 font-medium lg:w-[20%]">{sortButton("endDate", "End Date")}</th>
          <th scope="col" className="w-[7%] lg:w-[5%]"><span className="sr-only">Actions</span></th>
        </tr></thead>
        <tbody>
          {shown.map((entry) => {
            const project = projectCatalog.find((item) => item.id === entry.projectId);
            if (!project) return null;
            return <Fragment key={entry.projectId}>
              <tr className="align-top">
                <td className="px-4 pt-5 font-medium">{project.name}</td>
                <td className="hidden px-4 pt-5 lg:table-cell">{project.domain}</td>
                <td className="px-4 pt-5">{formatProjectDate(entry.startDate)}</td>
                <td className="px-4 pt-5">{formatProjectDate(entry.endDate)}</td>
                <td className="pt-4">
                    <button type="button" aria-label={`Actions for ${project.name}`} aria-haspopup="menu" aria-expanded={openMenu === entry.projectId}
                      ref={openMenu === entry.projectId ? menuButtonRef : undefined}
                      className="grid h-7 w-7 place-items-center hover:text-[var(--red)]"
                      onClick={(event) => toggleMenu(entry.projectId, event.currentTarget)}><AppIcon name="more" /></button>
                    {openMenu === entry.projectId && createPortal(<div ref={menuRef} role="menu" aria-label={`Actions for ${project.name}`}
                      style={menuPosition}
                      className="fixed z-50 min-w-32 border border-[var(--border)] bg-[var(--project-dialog-surface)] py-1 text-sm text-[var(--text)] shadow-lg"
                      onKeyDown={(event) => {
                        if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
                        event.preventDefault();
                        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
                        const index = items.indexOf(document.activeElement as HTMLButtonElement);
                        items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
                      }}>
                      <button type="button" role="menuitem" className="block w-full px-4 py-2 text-left hover:bg-[var(--sidebar-active)]" onClick={() => { setOpenMenu(null); setDialog({ kind: "update", entry }); }}>Update</button>
                      <button type="button" role="menuitem" className="block w-full px-4 py-2 text-left hover:bg-[var(--sidebar-active)]" onClick={() => { setOpenMenu(null); setDialog({ kind: "remove", entry }); }}>Delete</button>
                    </div>, document.body)}
                </td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td colSpan={5} className="hidden px-4 pb-5 pt-3 text-base leading-6 text-[var(--muted)] lg:table-cell">
                  <p className="line-clamp-2" title={project.description}>{project.description}</p>
                  {entry.responsibilities.length > 0 && <div className="mt-3 flex flex-wrap gap-1">
                    {entry.responsibilities.map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-[var(--sidebar-active)] px-2 py-1 text-xs text-[var(--text)]">{item}</span>)}
                  </div>}
                </td>
                <td colSpan={4} className="px-4 pb-5 pt-3 text-base leading-6 text-[var(--muted)] lg:hidden">
                  <p className="line-clamp-2" title={project.description}>{project.description}</p>
                  {entry.responsibilities.length > 0 && <div className="mt-3 flex flex-wrap gap-1">
                    {entry.responsibilities.map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-[var(--sidebar-active)] px-2 py-1 text-xs text-[var(--text)]">{item}</span>)}
                  </div>}
                </td>
              </tr>
            </Fragment>;
          })}
        </tbody>
      </table>
      {entries.length === 0 && <p role="status" className="py-12 text-center text-[var(--muted)]">No projects added yet</p>}
      {entries.length > 0 && shown.length === 0 && <p role="status" className="py-12 text-center text-[var(--muted)]">No projects found</p>}
    </div>
    {dialog?.kind === "add" && <ProjectFormDialog kind="add" cvId={cv.id} assigned={entries} onClose={() => setDialog(null)} onSave={addCvProject} />}
    {dialog?.kind === "update" && <ProjectFormDialog kind="update" cvId={cv.id} entry={dialog.entry} assigned={entries} onClose={() => setDialog(null)} onSave={updateCvProject} />}
    {dialog?.kind === "remove" && <RemoveProjectDialog project={projectCatalog.find((item) => item.id === dialog.entry.projectId)!} onClose={() => setDialog(null)} onConfirm={() => removeCvProject(cv.id, dialog.entry.projectId)} />}
  </section>;
}
