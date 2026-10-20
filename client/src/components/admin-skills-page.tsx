"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { AdminCatalogPage } from "@/components/admin-catalog-page";
import { SkillDialog } from "@/components/skill-dialogs";
import { filterAndSortSkills, skillNameExists, type AdminSkill } from "@/components/admin-skills-data";
import { CREATE_SKILL, DELETE_SKILL, loadAllCatalogItems, SKILL_CATEGORIES_QUERY, SKILLS_QUERY, UPDATE_SKILL, type ApiSkill, type ApiSkillCategory } from "@/lib/catalog-api";

function fromApi(skill: ApiSkill): AdminSkill {
  return { id: skill.id, name: skill.name, category: skill.category.name, categoryId: skill.category.id, categoryType: skill.category.parent?.name ?? skill.category.name };
}

export function AdminSkillsPage() {
  const client = useApolloClient();
  const categoriesResult = useQuery(SKILL_CATEGORIES_QUERY, { fetchPolicy: "network-only" });
  const categories = categoriesResult.data?.skillCategories ?? [];
  const loadItems = useCallback(async () => (await loadAllCatalogItems(client, SKILLS_QUERY, "skills")).map(fromApi), [client]);
  function categoryId(name: string) {
    const id = categories.find((category) => category.name === name)?.id;
    if (!id) throw new Error("Skill category is unavailable");
    return id;
  }
  return <AdminCatalogPage<AdminSkill>
    singular="Skill" plural="Skills" layout="wide"
    initialItems={[]} loadItems={loadItems}
    createItem={async (skill) => {
      const { data } = await client.mutate<{ createSkill: ApiSkill }>({ mutation: CREATE_SKILL, variables: { skill: { name: skill.name, categoryId: categoryId(skill.category) } } });
      if (!data?.createSkill) throw new Error("Skill was not created");
      return fromApi(data.createSkill);
    }}
    updateItem={async (skill) => {
      const { data } = await client.mutate<{ updateSkill: ApiSkill }>({ mutation: UPDATE_SKILL, variables: { skill: { skillId: skill.id, name: skill.name, categoryId: categoryId(skill.category) } } });
      if (!data?.updateSkill) throw new Error("Skill was not updated");
      return fromApi(data.updateSkill);
    }}
    deleteItem={async (id) => {
      const { data } = await client.mutate<{ deleteSkill: { affected: number } }>({ mutation: DELETE_SKILL, variables: { skill: { skillId: id } } });
      if (!data?.deleteSkill.affected) throw new Error("Skill was not deleted");
    }}
    columns={[
      { key: "name", label: "Name", sortable: true, render: (item) => item.name },
      { key: "type", label: "Type", className: "max-[900px]:hidden", render: (item) => item.categoryType ?? "" },
      { key: "category", label: "Category", render: (item) => item.category },
    ]}
    filterAndSort={(items, search, sort) => filterAndSortSkills(items, search, sort?.direction ?? null)}
    renderDialog={({ dialog, actions }) => {
      if (dialog?.type === "create") return <AdminSkillFormDialog key="create" skills={actions.items} categories={categories}
        onClose={actions.close} onSave={(name, category) => actions.create({ id: crypto.randomUUID(), name, category })} />;
      if (dialog?.type === "edit") return <AdminSkillFormDialog key={dialog.item.id} skill={dialog.item}
        skills={actions.items} categories={categories} onClose={actions.close}
        onSave={(name, category) => actions.update({ ...dialog.item, name, category })} />;
      if (dialog?.type === "delete") return <AdminSkillDeleteDialog key={dialog.item.id} skill={dialog.item}
        onClose={actions.close} onDelete={() => actions.remove(dialog.item.id)} />;
      return null;
    }}
  />;
}
function AdminSkillFormDialog({ skill, skills, categories, onClose, onSave }: {
  skill?: AdminSkill;
  skills: AdminSkill[];
  categories: ApiSkillCategory[];
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
    <form className="mt-6 flex flex-col gap-9 [&>div:last-child]:-mt-2.5" onSubmit={submit} noValidate>
      <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:leading-4 [&>label]:text-[var(--muted)] [&>input]:block [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[var(--border)] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-sm [&>input]:leading-6 [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:placeholder:text-[var(--placeholder)] [&>select]:block [&>select]:h-12 [&>select]:w-full [&>select]:rounded-none [&>select]:border [&>select]:border-[var(--border)] [&>select]:bg-[var(--surface)] [&>select]:px-[11px] [&>select]:text-sm [&>select]:leading-6 [&>select]:tracking-[.15px] [&>select]:text-[var(--text)] [&>[aria-invalid=true]]:border-[var(--red)]">
        <label htmlFor="admin-skill-name">Name</label>
        <input id="admin-skill-name" type="text" placeholder="Name" value={name} disabled={saving} aria-invalid={nameTouched && (!name.trim() || duplicate)}
          aria-describedby={nameTouched && (!name.trim() || duplicate) ? "admin-skill-name-error" : undefined}
          onBlur={() => setNameTouched(true)} onChange={(event) => { setName(event.target.value); setSystemError(""); }} />
        {nameTouched && (!name.trim() || duplicate) && <span id="admin-skill-name-error" className="mt-1 block text-xs leading-4 text-[var(--red)]">{duplicate ? "Skill already exists" : "Skill is required"}</span>}
      </div>
      <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:leading-4 [&>label]:text-[var(--muted)] [&>input]:block [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[var(--border)] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-sm [&>input]:leading-6 [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:placeholder:text-[var(--placeholder)] [&>select]:block [&>select]:h-12 [&>select]:w-full [&>select]:rounded-none [&>select]:border [&>select]:border-[var(--border)] [&>select]:bg-[var(--surface)] [&>select]:px-[11px] [&>select]:text-sm [&>select]:leading-6 [&>select]:tracking-[.15px] [&>select]:text-[var(--text)] [&>[aria-invalid=true]]:border-[var(--red)]">
        <label htmlFor="admin-skill-category">Category</label>
        <select id="admin-skill-category" value={category} disabled={saving} aria-invalid={categoryTouched && !category}
          aria-describedby={categoryTouched && !category ? "admin-skill-category-error" : undefined}
          onBlur={() => setCategoryTouched(true)} onChange={(event) => { setCategory(event.target.value); setSystemError(""); }}>
          <option value="">Category</option>
          {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
        {categoryTouched && !category && <span id="admin-skill-category-error" className="mt-1 block text-xs leading-4 text-[var(--red)]">Category is required</span>}
      </div>
      {systemError && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{systemError}</p>}
      <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
        <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={!valid || saving}>{saving ? "Saving..." : skill ? "Update" : "Create"}</button>
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
    <p className="mt-6 mb-7 text-base leading-6 tracking-[.15px]">Are you sure you want to delete skill <strong>{skill.name}</strong>?</p>
    {error && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{error}</p>}
    <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
      <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={deleting} onClick={confirm}>{deleting ? "Deleting..." : "Confirm"}</button>
    </div>
  </SkillDialog>;
}
