"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useApolloClient } from "@apollo/client/react";
import { AdminCatalogPage, type CatalogSort } from "@/components/admin-catalog-page";
import { type CatalogProject, formatProjectDate } from "@/components/cv-projects-data";
import { SkillDialog } from "@/components/skill-dialogs";
import { loadProjects, toCatalogProject, type ApiProject } from "@/lib/cv-api";
import { gql } from "@apollo/client";
import { getApiErrorMessage } from "@/lib/common/graphql-errors";

const CREATE_PROJECT = gql`mutation CreateCatalogProject($project: CreateProjectInput!) {
  createProject(project: $project) { id name domain description environment start_date end_date }
}`;
const UPDATE_PROJECT = gql`mutation UpdateCatalogProject($project: UpdateProjectInput!) {
  updateProject(project: $project) { id name domain description environment start_date end_date }
}`;
const DELETE_PROJECT = gql`mutation DeleteCatalogProject($project: DeleteProjectInput!) {
  deleteProject(project: $project) { affected }
}`;

type ProjectFields = Omit<CatalogProject, "id">;
type FieldErrors = Partial<Record<"name" | "domain" | "startDate" | "endDate" | "description", string>>;

function validate(fields: ProjectFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = "Project name is required";
  else if (fields.name.trim().length > 100) errors.name = "Project name must contain at most 100 characters";
  if (!fields.domain.trim()) errors.domain = "Domain is required";
  else if (fields.domain.trim().length > 100) errors.domain = "Domain must contain at most 100 characters";
  if (!fields.startDate) errors.startDate = "Start date is required";
  if (!fields.endDate) errors.endDate = "End date is required";
  else if (fields.startDate && fields.endDate < fields.startDate) errors.endDate = "End date must be later than start date";
  if (!fields.description.trim()) errors.description = "Description is required";
  else if (fields.description.trim().length > 2000) errors.description = "Description must contain at most 2000 characters";
  return errors;
}

function filterAndSortProjects(items: CatalogProject[], search: string, sort: CatalogSort) {
  const query = search.trim().toLocaleLowerCase();
  const matching = items.filter((item) => `${item.name} ${item.domain}`.toLocaleLowerCase().includes(query));
  if (!sort) return matching;
  return matching.sort((left, right) => {
    const field = sort.field as "name" | "startDate" | "endDate";
    const result = (left[field] ?? "").localeCompare(right[field] ?? "", undefined, { sensitivity: "base" });
    return sort.direction === "asc" ? result : -result;
  });
}

export function AdminProjectsPage() {
  const client = useApolloClient();
  const loadItems = useCallback(() => loadProjects(client), [client]);
  return <AdminCatalogPage<CatalogProject>
    singular="Project" plural="Projects" layout="projects"
    initialItems={[]} loadItems={loadItems}
    createItem={async (item) => {
      const { data } = await client.mutate<{ createProject: ApiProject }>({ mutation: CREATE_PROJECT, variables: { project: toInput(item) } });
      if (!data?.createProject) throw new Error("Project was not created");
      return toCatalogProject(data.createProject);
    }}
    updateItem={async (item) => {
      const { data } = await client.mutate<{ updateProject: ApiProject }>({ mutation: UPDATE_PROJECT, variables: { project: { projectId: item.id, ...toInput(item) } } });
      if (!data?.updateProject) throw new Error("Project was not updated");
      return toCatalogProject(data.updateProject);
    }}
    deleteItem={async (id) => {
      const { data } = await client.mutate<{ deleteProject: { affected: number } }>({ mutation: DELETE_PROJECT, variables: { project: { projectId: id } } });
      if (!data?.deleteProject.affected) throw new Error("Project was not deleted");
    }}
    columns={[
      { key: "name", label: "Name", sortable: true, render: (project) => <div className="min-w-0"><strong className="block break-words">{project.name}</strong><p className="mt-1 break-words text-sm text-[var(--muted)]">{project.description}</p><div className="mt-2 flex flex-wrap gap-1">{project.environment.map((technology) => <span className="max-w-full break-all rounded-full border border-[var(--border)] px-2 py-0.5 text-xs" key={technology}>{technology}</span>)}</div></div> },
      { key: "domain", label: "Domain", render: (project) => <span className="break-words">{project.domain}</span> },
      { key: "startDate", label: "Start Date", sortable: true, render: (project) => formatProjectDate(project.startDate) },
      { key: "endDate", label: "End Date", sortable: true, render: (project) => project.endDate ? formatProjectDate(project.endDate) : "—" },
    ]}
    filterAndSort={filterAndSortProjects}
    renderDialog={({ dialog, actions }) => {
      if (dialog?.type === "create") return <ProjectFormDialog key="create" onClose={actions.close}
        onSave={(fields) => actions.create({ ...fields, id: crypto.randomUUID() })} />;
      if (dialog?.type === "edit") return <ProjectFormDialog key={dialog.item.id} project={dialog.item} onClose={actions.close}
        onSave={(fields) => actions.update({ ...fields, id: dialog.item.id })} />;
      if (dialog?.type === "delete") return <ProjectDeleteDialog key={dialog.item.id} project={dialog.item}
        onClose={actions.close} onDelete={() => actions.remove(dialog.item.id)} />;
      return null;
    }}
  />;
}

function toInput(item: ProjectFields) {
  return {
    name: item.name.trim(), domain: item.domain.trim(), description: item.description.trim(),
    start_date: item.startDate, end_date: item.endDate, environment: item.environment,
  };
}

function ProjectFormDialog({ project, onClose, onSave }: {
  project?: CatalogProject;
  onClose: () => void;
  onSave: (fields: ProjectFields) => Promise<void>;
}) {
  const [fields, setFields] = useState<ProjectFields>(() => project ? {
    name: project.name, domain: project.domain, description: project.description,
    startDate: project.startDate, endDate: project.endDate, environment: project.environment,
  } : { name: "", domain: "", description: "", startDate: "", endDate: "", environment: [] });
  const [technology, setTechnology] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState("");
  const errors = validate(fields);
  const inputClass = "h-11 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--red)]";
  const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

  function setField<K extends keyof ProjectFields>(field: K, value: ProjectFields[K]) {
    setFields((current) => ({ ...current, [field]: value }));
    setRequestError("");
  }

  function addTechnology() {
    const value = technology.trim();
    if (value && !fields.environment.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setField("environment", [...fields.environment, value]);
    }
    setTechnology("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (saving || Object.keys(errors).length) return;
    setSaving(true); setRequestError("");
    try { await onSave(fields); onClose(); }
    catch (error) { setRequestError(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  }

  const field = (key: "name" | "domain" | "startDate" | "endDate", label: string, type = "text", maxLength?: number) => <div className={labelClass}>
    <label htmlFor={`project-${key}`}>{label}</label><input id={`project-${key}`} className={inputClass} type={type} value={fields[key] ?? ""} maxLength={maxLength} disabled={saving}
      aria-invalid={touched && Boolean(errors[key])} onBlur={() => setTouched(true)}
      onChange={(event) => setField(key, event.target.value)} />
    {touched && errors[key] && <span className="text-[var(--red)]" role="alert">{errors[key]}</span>}
  </div>;

  return <SkillDialog title={project ? "Update project" : "Create project"} onClose={onClose}>
    <form onSubmit={(event) => { void submit(event); }} className="grid max-h-[72vh] gap-4 overflow-y-auto pr-1" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">{field("name", "Name", "text", 100)}{field("domain", "Domain", "text", 100)}{field("startDate", "Start Date", "date")}{field("endDate", "End Date", "date")}</div>
      <div className={labelClass}><label htmlFor="project-description">Description</label>
        <textarea id="project-description" className={`${inputClass} min-h-28 py-2`} value={fields.description} maxLength={2000} disabled={saving}
          aria-invalid={touched && Boolean(errors.description)} onBlur={() => setTouched(true)} onChange={(event) => setField("description", event.target.value)} />
        {touched && errors.description && <span className="text-[var(--red)]" role="alert">{errors.description}</span>}
      </div>
      <div className={labelClass}><label htmlFor="project-technology">Environment</label>
        <div className="flex gap-2"><input id="project-technology" className={inputClass} value={technology} disabled={saving} placeholder="Technology"
          onChange={(event) => setTechnology(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTechnology(); } }} />
          <button type="button" className="rounded border border-[var(--border)] px-3" disabled={!technology.trim() || saving} onClick={addTechnology}>Add</button></div>
        <div className="flex flex-wrap gap-2">{fields.environment.map((item) => <span key={item} className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1 text-xs break-all">{item}
          <button type="button" aria-label={`Remove ${item}`} disabled={saving} onClick={() => setField("environment", fields.environment.filter((value) => value !== item))}>×</button></span>)}</div>
      </div>
      {requestError && <p className="text-[var(--red)]" role="alert">{requestError}</p>}
      <div className="flex justify-end gap-3 pt-2"><button type="button" className="rounded-full border border-[var(--border)] px-6 py-2" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="rounded-full bg-[var(--red)] px-6 py-2 text-white disabled:opacity-50" disabled={saving}>{saving ? "Saving..." : project ? "Update" : "Create"}</button></div>
    </form>
  </SkillDialog>;
}

function ProjectDeleteDialog({ project, onClose, onDelete }: { project: CatalogProject; onClose: () => void; onDelete: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (deleting) return;
    setDeleting(true); setError("");
    try { await onDelete(); onClose(); }
    catch (caught) { setError(getApiErrorMessage(caught)); }
    finally { setDeleting(false); }
  }
  return <SkillDialog title="Delete project" onClose={onClose}>
    <p>Are you sure you want to delete project <strong>{project.name}</strong>?</p>
    {error && <p role="alert" className="mt-3 text-[var(--red)]">{error}</p>}
    <div className="mt-6 flex justify-end gap-3"><button type="button" className="rounded-full border border-[var(--border)] px-6 py-2" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="rounded-full bg-[var(--red)] px-6 py-2 text-white disabled:opacity-50" disabled={deleting} onClick={() => { void confirm(); }}>{deleting ? "Deleting..." : "Confirm"}</button></div>
  </SkillDialog>;
}
