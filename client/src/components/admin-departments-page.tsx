"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AppIcon } from "@/components/app-icon";
import { SkillDialog } from "@/components/skill-dialogs";
import {
  departmentNameExists,
  filterAndSortDepartments,
  initialAdminDepartments,
  type AdminDepartment,
  type DepartmentSort,
} from "@/components/admin-departments-data";

type DialogState = { type: "create" } | { type: "edit" | "delete"; department: AdminDepartment } | null;
const PAGE_SIZE = 10;

export function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState(initialAdminDepartments);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<DepartmentSort>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const createTrigger = useRef<HTMLButtonElement>(null);

  const matchingDepartments = useMemo(
    () => filterAndSortDepartments(departments, search, sort),
    [departments, search, sort],
  );
  const pageCount = Math.ceil(matchingDepartments.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const visibleDepartments = matchingDepartments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  function closeDialog() {
    setDialog(null);
    requestAnimationFrame(() => {
      if (menuTrigger.current?.isConnected) menuTrigger.current.focus();
      else createTrigger.current?.focus();
    });
  }

  function createDepartment(name: string) {
    setDepartments((current) => [...current, { id: crypto.randomUUID(), name }]);
    setSearch("");
    setSort(null);
    setPage(Math.ceil((departments.length + 1) / PAGE_SIZE));
  }

  function updateDepartment(id: string, name: string) {
    const index = departments.findIndex((item) => item.id === id);
    setDepartments((current) => current.map((item) => item.id === id ? { ...item, name } : item));
    setSearch("");
    setSort(null);
    setPage(Math.floor(Math.max(index, 0) / PAGE_SIZE) + 1);
  }

  function deleteDepartment(department: AdminDepartment) {
    if (department.inUse) throw new Error("departmentInUse");
    setDepartments((current) => current.filter((item) => item.id !== department.id));
  }

  return <section className="admin-departments-page" aria-label="Departments catalog">
    <div className="profile-cvs-toolbar admin-departments-toolbar">
      <label className="search-field profile-cvs-search">
        <AppIcon name="search" />
        <span className="sr-only">Search departments by name</span>
        <input type="search" placeholder="Search" value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); setOpenMenuId(null); }} />
      </label>
      <button type="button" ref={createTrigger} className="create-action profile-cvs-create"
        aria-label="Create department" onClick={() => { menuTrigger.current = null; setDialog({ type: "create" }); }}>
        <AppIcon name="plus" /><span>Create department</span>
      </button>
    </div>

    <div className="admin-departments-table" role="table" aria-label="Departments">
      <div className="admin-departments-row admin-departments-heading" role="row">
        <div role="columnheader" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"}>
          <button type="button" className="profile-cvs-sort"
            aria-label={`Sort by name${sort ? `, currently ${sort === "asc" ? "ascending" : "descending"}` : ""}`}
            onClick={() => { setSort((current) => current === "asc" ? "desc" : "asc"); setPage(1); setOpenMenuId(null); }}>
            Name <AppIcon name="sort" className={sort === "desc" ? "sort-indicator profile-cvs-sort--desc" : "sort-indicator"} />
          </button>
        </div>
        <span role="columnheader"><span className="sr-only">Actions</span></span>
      </div>

      {visibleDepartments.length === 0 ? <div className="admin-departments-state" role="row">
        <p role="cell">No departments found</p>
      </div> : visibleDepartments.map((department) => <div className="admin-departments-row admin-departments-item" role="row" key={department.id}>
        <span role="cell">{department.name}</span>
        <div className="profile-cv-actions" role="cell" ref={openMenuId === department.id ? menuRoot : undefined}>
          <button type="button" className="profile-cv-more" aria-label={`Actions for ${department.name}`}
            aria-haspopup="menu" aria-expanded={openMenuId === department.id}
            onClick={(event) => { menuTrigger.current = event.currentTarget; setOpenMenuId((value) => value === department.id ? null : department.id); }}>
            <AppIcon name="more" />
          </button>
          {openMenuId === department.id && <div className="profile-cv-actions-menu" role="menu" aria-label={`Actions for ${department.name}`}
            onKeyDown={(event) => {
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
              const at = items.indexOf(document.activeElement as HTMLElement);
              items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length]?.focus();
            }}>
            <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setDialog({ type: "edit", department }); }}>Edit</button>
            <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setDialog({ type: "delete", department }); }}>Delete</button>
          </div>}
        </div>
      </div>)}
    </div>

    {pageCount > 1 && <nav className="profile-cvs-pagination" aria-label="Department pages">
      <button type="button" disabled={currentPage === 1} aria-label="Previous page" onClick={() => setPage(currentPage - 1)}>‹</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number}
        aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined}
        onClick={() => { setPage(number); setOpenMenuId(null); }}>{number}</button>)}
      <button type="button" disabled={currentPage === pageCount} aria-label="Next page" onClick={() => setPage(currentPage + 1)}>›</button>
    </nav>}

    {dialog?.type === "create" && <AdminDepartmentFormDialog departments={departments} onClose={closeDialog} onSave={createDepartment} />}
    {dialog?.type === "edit" && <AdminDepartmentFormDialog department={dialog.department} departments={departments}
      onClose={closeDialog} onSave={(name) => updateDepartment(dialog.department.id, name)} />}
    {dialog?.type === "delete" && <AdminDepartmentDeleteDialog department={dialog.department} onClose={closeDialog}
      onDelete={() => deleteDepartment(dialog.department)} />}
  </section>;
}

function AdminDepartmentFormDialog({ department, departments, onClose, onSave }: {
  department?: AdminDepartment;
  departments: AdminDepartment[];
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
}) {
  const [name, setName] = useState(department?.name ?? "");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemError, setSystemError] = useState("");
  const duplicate = departmentNameExists(departments, name, department?.id);
  const error = !name.trim() ? "Department name is required" : duplicate ? "Department already exists" : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (error || saving) return;
    setSaving(true);
    setSystemError("");
    try {
      await onSave(name.trim());
      onClose();
    } catch {
      setSystemError("Something went wrong. Please try again later");
    } finally {
      setSaving(false);
    }
  }

  return <SkillDialog title={department ? "Edit department" : "Create department"} onClose={onClose}>
    <form className="admin-department-dialog-form" onSubmit={submit} noValidate>
      <div className="admin-department-field">
        <label htmlFor="admin-department-name" className={name ? undefined : "sr-only"}>Department</label>
        <input id="admin-department-name" type="text" placeholder="Department" value={name} disabled={saving}
          aria-invalid={touched && Boolean(error)} aria-describedby={touched && error ? "admin-department-name-error" : undefined}
          onBlur={(event) => {
            if (event.relatedTarget instanceof HTMLElement && event.currentTarget.closest("dialog")?.contains(event.relatedTarget)) setTouched(true);
          }}
          onChange={(event) => { setName(event.target.value); setTouched(true); setSystemError(""); }} />
        {touched && error && <span id="admin-department-name-error" className="cv-skill-field-error">{error}</span>}
      </div>
      {systemError && <p className="cv-skill-system-error" role="alert">{systemError}</p>}
      <div className="profile-cv-dialog-actions">
        <button type="button" className="profile-cv-dialog-cancel" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="profile-cv-dialog-submit" disabled={saving}>
          {saving ? "Saving..." : department ? "Save" : "Create"}
        </button>
      </div>
    </form>
  </SkillDialog>;
}

function AdminDepartmentDeleteDialog({ department, onClose, onDelete }: {
  department: AdminDepartment;
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
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "departmentInUse"
        ? "Department cannot be deleted because it is currently in use"
        : "Something went wrong. Please try again later");
    } finally {
      setDeleting(false);
    }
  }

  return <SkillDialog title="Delete department" onClose={onClose}>
    <p className="profile-cv-dialog-message">Are you sure you want to delete department <strong>{department.name}</strong>?</p>
    {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
    <div className="profile-cv-dialog-actions">
      <button type="button" className="profile-cv-dialog-cancel" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="profile-cv-dialog-submit" disabled={deleting} onClick={confirm}>
        {deleting ? "Deleting..." : "Confirm"}
      </button>
    </div>
  </SkillDialog>;
}
