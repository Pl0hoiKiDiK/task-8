"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AppIcon } from "@/components/app-icon";
import { SkillDialog } from "@/components/skill-dialogs";
import { filterAndSortSkills, initialAdminSkills, skillCategories, skillNameExists, skillType, type AdminSkill } from "@/components/admin-skills-data";

type DialogState = { type: "create" } | { type: "edit" | "delete"; skill: AdminSkill } | null;
const PAGE_SIZE = 10;

export function AdminSkillsPage() {
  const [skills, setSkills] = useState(initialAdminSkills);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc" | null>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const createTrigger = useRef<HTMLButtonElement>(null);
  const matchingSkills = useMemo(() => filterAndSortSkills(skills, search, direction), [skills, search, direction]);
  const pageCount = Math.ceil(matchingSkills.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const visibleSkills = matchingSkills.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!openMenuId) return;
    menuRoot.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRoot.current?.contains(event.target)) setOpenMenuId(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenMenuId(null); menuTrigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [openMenuId]);

  function openAction(type: "edit" | "delete", skill: AdminSkill) {
    setOpenMenuId(null);
    setDialog({ type, skill });
  }

  function closeDialog() {
    setDialog(null);
    requestAnimationFrame(() => {
      if (menuTrigger.current?.isConnected) menuTrigger.current.focus();
      else createTrigger.current?.focus();
    });
  }

  return (
    <section className="admin-skills-page" aria-label="Skills catalog">
      <div className="profile-cvs-toolbar admin-skills-toolbar">
        <label className="search-field profile-cvs-search">
          <AppIcon name="search" />
          <span className="sr-only">Search skills by name</span>
          <input type="search" placeholder="Search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setOpenMenuId(null); }} />
        </label>
        <button type="button" ref={createTrigger} className="create-action profile-cvs-create" aria-label="Create skill" onClick={() => { menuTrigger.current = null; setDialog({ type: "create" }); }}>
          <AppIcon name="plus" /><span>Create skill</span>
        </button>
      </div>

      <div className="admin-skills-table" role="table" aria-label="Skills">
        <div className="admin-skills-row admin-skills-heading" role="row">
          <div role="columnheader" aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}>
            <button type="button" className="profile-cvs-sort" aria-label={`Sort by name${direction ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
              onClick={() => { setDirection((value) => value === "asc" ? "desc" : "asc"); setPage(1); }}>
              Name <AppIcon name="sort" className={direction === "desc" ? "sort-indicator profile-cvs-sort--desc" : "sort-indicator"} />
            </button>
          </div>
          <span className="admin-skills-type" role="columnheader">Type</span>
          <span role="columnheader">Category</span>
          <span role="columnheader"><span className="sr-only">Actions</span></span>
        </div>
        {visibleSkills.length === 0 ? (
          <p className="profile-cvs-empty" role="status">No skills found</p>
        ) : visibleSkills.map((skill) => (
          <div className="admin-skills-row admin-skills-item" role="row" key={skill.id}>
            <span role="cell">{skill.name}</span>
            <span role="cell" className="admin-skills-type">{skillType(skill.category)}</span>
            <span role="cell">{skill.category}</span>
            <div className="profile-cv-actions" role="cell" ref={openMenuId === skill.id ? menuRoot : undefined}>
              <button type="button" className="profile-cv-more" aria-label={`Actions for ${skill.name}`} aria-haspopup="menu" aria-expanded={openMenuId === skill.id}
                onClick={(event) => { menuTrigger.current = event.currentTarget; setOpenMenuId((value) => value === skill.id ? null : skill.id); }}>
                <AppIcon name="more" />
              </button>
              {openMenuId === skill.id && <div className="profile-cv-actions-menu" role="menu" aria-label={`Actions for ${skill.name}`}
                onKeyDown={(event) => {
                  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                  const at = items.indexOf(document.activeElement as HTMLElement);
                  items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length]?.focus();
                }}>
                <button type="button" role="menuitem" onClick={() => openAction("edit", skill)}>Edit</button>
                <button type="button" role="menuitem" onClick={() => openAction("delete", skill)}>Delete</button>
              </div>}
            </div>
          </div>
        ))}
      </div>
      {pageCount > 1 && <nav className="profile-cvs-pagination" aria-label="Skill pages">
        <button type="button" disabled={currentPage === 1} aria-label="Previous page" onClick={() => setPage(currentPage - 1)}>‹</button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number} aria-label={`Page ${number}`}
          aria-current={currentPage === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
        <button type="button" disabled={currentPage === pageCount} aria-label="Next page" onClick={() => setPage(currentPage + 1)}>›</button>
      </nav>}
      {dialog?.type === "create" && <AdminSkillFormDialog skills={skills} onClose={closeDialog} onSave={(name, category) => {
        setSkills((value) => [...value, { id: crypto.randomUUID(), name, category }]);
      }} />}
      {dialog?.type === "edit" && <AdminSkillFormDialog skill={dialog.skill} skills={skills} onClose={closeDialog} onSave={(name, category) => {
        setSkills((value) => value.map((item) => item.id === dialog.skill.id ? { ...item, name, category } : item));
      }} />}
      {dialog?.type === "delete" && <AdminSkillDeleteDialog skill={dialog.skill} onClose={closeDialog} onDelete={() => {
        setSkills((value) => value.filter((item) => item.id !== dialog.skill.id));
      }} />}
    </section>
  );
}

function AdminSkillFormDialog({ skill, skills, onClose, onSave }: {
  skill?: AdminSkill;
  skills: AdminSkill[];
  onClose: () => void;
  onSave: (name: string, category: string) => void | Promise<void>;
}) {
  const [name, setName] = useState(skill?.name ?? "");
  const [category, setCategory] = useState(skill?.category ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemError, setSystemError] = useState("");
  const duplicate = skillNameExists(skills, name, skill?.id);
  const valid = Boolean(name.trim() && category && !duplicate);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameTouched(true);
    setCategoryTouched(true);
    if (!valid || saving) return;
    setSaving(true);
    setSystemError("");
    try { await onSave(name.trim(), category); onClose(); }
    catch { setSystemError(skill ? "Failed to update skill. Please try again." : "Failed to create skill. Please try again."); }
    finally { setSaving(false); }
  }

  return <SkillDialog title={skill ? "Update skill" : "Create skill"} onClose={onClose}>
    <form className="admin-skill-dialog-form" onSubmit={submit} noValidate>
      <div className="admin-skill-field">
        <label htmlFor="admin-skill-name">Name</label>
        <input id="admin-skill-name" type="text" placeholder="Name" value={name} disabled={saving} aria-invalid={nameTouched && (!name.trim() || duplicate)}
          aria-describedby={nameTouched && (!name.trim() || duplicate) ? "admin-skill-name-error" : undefined}
          onBlur={() => setNameTouched(true)} onChange={(event) => { setName(event.target.value); setSystemError(""); }} />
        {nameTouched && (!name.trim() || duplicate) && <span id="admin-skill-name-error" className="cv-skill-field-error">{duplicate ? "Skill already exists" : "Skill is required"}</span>}
      </div>
      <div className="admin-skill-field">
        <label htmlFor="admin-skill-category">Category</label>
        <select id="admin-skill-category" value={category} disabled={saving} aria-invalid={categoryTouched && !category}
          aria-describedby={categoryTouched && !category ? "admin-skill-category-error" : undefined}
          onBlur={() => setCategoryTouched(true)} onChange={(event) => { setCategory(event.target.value); setSystemError(""); }}>
          <option value="">Category</option>
          {skillCategories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
        </select>
        {categoryTouched && !category && <span id="admin-skill-category-error" className="cv-skill-field-error">Category is required</span>}
      </div>
      {systemError && <p className="cv-skill-system-error" role="alert">{systemError}</p>}
      <div className="profile-cv-dialog-actions">
        <button type="button" className="profile-cv-dialog-cancel" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="profile-cv-dialog-submit" disabled={!valid || saving}>{saving ? "Saving..." : skill ? "Update" : "Create"}</button>
      </div>
    </form>
  </SkillDialog>;
}

function AdminSkillDeleteDialog({ skill, onClose, onDelete }: { skill: AdminSkill; onClose: () => void; onDelete: () => void | Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try { await onDelete(); onClose(); }
    catch { setError("Failed to delete skill. Please try again."); }
    finally { setDeleting(false); }
  }
  return <SkillDialog title="Delete skill" onClose={onClose}>
    <p className="profile-cv-dialog-message">Are you sure you want to delete skill <strong>{skill.name}</strong>?</p>
    {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
    <div className="profile-cv-dialog-actions">
      <button type="button" className="profile-cv-dialog-cancel" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="profile-cv-dialog-submit" disabled={deleting} onClick={confirm}>{deleting ? "Deleting..." : "Confirm"}</button>
    </div>
  </SkillDialog>;
}
