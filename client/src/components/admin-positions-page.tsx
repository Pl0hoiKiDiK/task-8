"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AppIcon } from "@/components/app-icon";
import { SkillDialog } from "@/components/skill-dialogs";
import {
  positionNameExists,
  filterAndSortPositions,
  initialAdminPositions,
  type AdminPosition,
  type PositionSort,
} from "@/components/admin-positions-data";

type DialogState = { type: "create" } | { type: "edit" | "delete"; position: AdminPosition } | null;
const PAGE_SIZE = 10;

export function AdminPositionsPage() {
  const [positions, setPositions] = useState(initialAdminPositions);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PositionSort>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const createTrigger = useRef<HTMLButtonElement>(null);

  const matchingPositions = useMemo(
    () => filterAndSortPositions(positions, search, sort),
    [positions, search, sort],
  );
  const pageCount = Math.ceil(matchingPositions.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const visiblePositions = matchingPositions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  function createPosition(name: string) {
    setPositions((current) => [...current, { id: crypto.randomUUID(), name }]);
    setSearch("");
    setSort(null);
    setPage(Math.ceil((positions.length + 1) / PAGE_SIZE));
  }

  function updatePosition(id: string, name: string) {
    const index = positions.findIndex((item) => item.id === id);
    setPositions((current) => current.map((item) => item.id === id ? { ...item, name } : item));
    setSearch("");
    setSort(null);
    setPage(Math.floor(Math.max(index, 0) / PAGE_SIZE) + 1);
  }

  function deletePosition(position: AdminPosition) {
    if (position.inUse) throw new Error("positionInUse");
    setPositions((current) => current.filter((item) => item.id !== position.id));
  }

  return <section className="admin-positions-page" aria-label="Positions catalog">
    <div className="profile-cvs-toolbar admin-positions-toolbar">
      <label className="search-field profile-cvs-search">
        <AppIcon name="search" />
        <span className="sr-only">Search positions by name</span>
        <input type="search" placeholder="Search" value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); setOpenMenuId(null); }} />
      </label>
      <button type="button" ref={createTrigger} className="create-action profile-cvs-create"
        aria-label="Create position" onClick={() => { menuTrigger.current = null; setDialog({ type: "create" }); }}>
        <AppIcon name="plus" /><span>Create position</span>
      </button>
    </div>

    <div className="admin-positions-table" role="table" aria-label="Positions">
      <div className="admin-positions-row admin-positions-heading" role="row">
        <div role="columnheader" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"}>
          <button type="button" className="profile-cvs-sort"
            aria-label={`Sort by name${sort ? `, currently ${sort === "asc" ? "ascending" : "descending"}` : ""}`}
            onClick={() => { setSort((current) => current === "asc" ? "desc" : "asc"); setPage(1); setOpenMenuId(null); }}>
            Name <AppIcon name="sort" className={sort === "desc" ? "sort-indicator profile-cvs-sort--desc" : "sort-indicator"} />
          </button>
        </div>
        <span role="columnheader"><span className="sr-only">Actions</span></span>
      </div>

      {visiblePositions.length === 0 ? <div className="admin-positions-state" role="row">
        <p role="cell">No positions found</p>
      </div> : visiblePositions.map((position) => <div className="admin-positions-row admin-positions-item" role="row" key={position.id}>
        <span role="cell">{position.name}</span>
        <div className="profile-cv-actions" role="cell" ref={openMenuId === position.id ? menuRoot : undefined}>
          <button type="button" className="profile-cv-more" aria-label={`Actions for ${position.name}`}
            aria-haspopup="menu" aria-expanded={openMenuId === position.id}
            onClick={(event) => { menuTrigger.current = event.currentTarget; setOpenMenuId((value) => value === position.id ? null : position.id); }}>
            <AppIcon name="more" />
          </button>
          {openMenuId === position.id && <div className="profile-cv-actions-menu" role="menu" aria-label={`Actions for ${position.name}`}
            onKeyDown={(event) => {
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
              const at = items.indexOf(document.activeElement as HTMLElement);
              items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length]?.focus();
            }}>
            <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setDialog({ type: "edit", position }); }}>Edit</button>
            <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setDialog({ type: "delete", position }); }}>Delete</button>
          </div>}
        </div>
      </div>)}
    </div>

    {pageCount > 1 && <nav className="profile-cvs-pagination" aria-label="Position pages">
      <button type="button" disabled={currentPage === 1} aria-label="Previous page" onClick={() => setPage(currentPage - 1)}>‹</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number}
        aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined}
        onClick={() => { setPage(number); setOpenMenuId(null); }}>{number}</button>)}
      <button type="button" disabled={currentPage === pageCount} aria-label="Next page" onClick={() => setPage(currentPage + 1)}>›</button>
    </nav>}

    {dialog?.type === "create" && <AdminPositionFormDialog positions={positions} onClose={closeDialog} onSave={createPosition} />}
    {dialog?.type === "edit" && <AdminPositionFormDialog position={dialog.position} positions={positions}
      onClose={closeDialog} onSave={(name) => updatePosition(dialog.position.id, name)} />}
    {dialog?.type === "delete" && <AdminPositionDeleteDialog position={dialog.position} onClose={closeDialog}
      onDelete={() => deletePosition(dialog.position)} />}
  </section>;
}

function AdminPositionFormDialog({ position, positions, onClose, onSave }: {
  position?: AdminPosition;
  positions: AdminPosition[];
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
}) {
  const [name, setName] = useState(position?.name ?? "");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemError, setSystemError] = useState("");
  const duplicate = positionNameExists(positions, name, position?.id);
  const error = !name.trim() ? "Position name is required" : duplicate ? "Position already exists" : "";

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

  return <SkillDialog title={position ? "Edit position" : "Create position"} onClose={onClose}>
    <form className="admin-position-dialog-form" onSubmit={submit} noValidate>
      <div className="admin-position-field">
        <label htmlFor="admin-position-name" className={name ? undefined : "sr-only"}>Position</label>
        <input id="admin-position-name" type="text" placeholder="Position" value={name} disabled={saving}
          aria-invalid={touched && Boolean(error)} aria-describedby={touched && error ? "admin-position-name-error" : undefined}
          onBlur={(event) => {
            if (event.relatedTarget instanceof HTMLElement && event.currentTarget.closest("dialog")?.contains(event.relatedTarget)) setTouched(true);
          }}
          onChange={(event) => { setName(event.target.value); setTouched(true); setSystemError(""); }} />
        {touched && error && <span id="admin-position-name-error" className="cv-skill-field-error">{error}</span>}
      </div>
      {systemError && <p className="cv-skill-system-error" role="alert">{systemError}</p>}
      <div className="profile-cv-dialog-actions">
        <button type="button" className="profile-cv-dialog-cancel" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="profile-cv-dialog-submit" disabled={saving}>
          {saving ? "Saving..." : position ? "Save" : "Create"}
        </button>
      </div>
    </form>
  </SkillDialog>;
}

function AdminPositionDeleteDialog({ position, onClose, onDelete }: {
  position: AdminPosition;
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
      setError(caught instanceof Error && caught.message === "positionInUse"
        ? "Position cannot be deleted because it is currently in use"
        : "Something went wrong. Please try again later");
    } finally {
      setDeleting(false);
    }
  }

  return <SkillDialog title="Delete position" onClose={onClose}>
    <p className={`profile-cv-dialog-message${error ? " admin-position-delete-message--error" : ""}`}>
      Are you sure you want to delete position <strong>{position.name}</strong>?
    </p>
    {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
    <div className="profile-cv-dialog-actions">
      <button type="button" className="profile-cv-dialog-cancel" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="profile-cv-dialog-submit" disabled={deleting} onClick={confirm}>
        {deleting ? "Deleting..." : "Confirm"}
      </button>
    </div>
  </SkillDialog>;
}
