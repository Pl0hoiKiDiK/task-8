"use client";

import { useState, type FormEvent } from "react";
import { AdminCatalogPage } from "@/components/admin-catalog-page";
import { SkillDialog } from "@/components/skill-dialogs";
import { filterAndSortSkills, initialAdminSkills, skillCategories, skillNameExists, skillType, type AdminSkill } from "@/components/admin-skills-data";

export function AdminSkillsPage() {
  return <AdminCatalogPage<AdminSkill>
    singular="Skill" plural="Skills" className="admin-skills"
    initialItems={initialAdminSkills}
    columns={[
      { key: "name", label: "Name", sortable: true, render: (item) => item.name },
      { key: "type", label: "Type", className: "admin-skills-type", render: (item) => skillType(item.category) },
      { key: "category", label: "Category", render: (item) => item.category },
    ]}
    filterAndSort={(items, search, sort) => filterAndSortSkills(items, search, sort?.direction ?? null)}
    renderDialog={({ dialog, actions }) => {
      if (dialog?.type === "create") return <AdminSkillFormDialog key="create" skills={actions.items}
        onClose={actions.close} onSave={(name, category) => actions.create({ id: crypto.randomUUID(), name, category })} />;
      if (dialog?.type === "edit") return <AdminSkillFormDialog key={dialog.item.id} skill={dialog.item}
        skills={actions.items} onClose={actions.close}
        onSave={(name, category) => actions.update({ ...dialog.item, name, category })} />;
      if (dialog?.type === "delete") return <AdminSkillDeleteDialog key={dialog.item.id} skill={dialog.item}
        onClose={actions.close} onDelete={() => actions.remove(dialog.item.id)} />;
      return null;
    }}
  />;
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
