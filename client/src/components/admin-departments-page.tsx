"use client";

import { useState, type FormEvent } from "react";
import { AdminCatalogPage } from "@/components/admin-catalog-page";
import { SkillDialog } from "@/components/skill-dialogs";
import {
  departmentNameExists,
  filterAndSortDepartments,
  initialAdminDepartments,
  type AdminDepartment,
} from "@/components/admin-departments-data";

export function AdminDepartmentsPage() {
  return <AdminCatalogPage<AdminDepartment>
    singular="Department" plural="Departments" className="admin-departments"
    initialItems={initialAdminDepartments}
    columns={[{ key: "name", label: "Name", sortable: true, render: (item) => item.name }]}
    filterAndSort={(items, search, sort) => filterAndSortDepartments(items, search, sort?.direction ?? null)}
    renderDialog={({ dialog, actions }) => {
      if (dialog?.type === "create") return <AdminDepartmentFormDialog key="create" departments={actions.items}
        onClose={actions.close} onSave={(name) => actions.create({ id: crypto.randomUUID(), name })} />;
      if (dialog?.type === "edit") return <AdminDepartmentFormDialog key={dialog.item.id} department={dialog.item}
        departments={actions.items} onClose={actions.close}
        onSave={(name) => actions.update({ ...dialog.item, name })} />;
      if (dialog?.type === "delete") return <AdminDepartmentDeleteDialog key={dialog.item.id} department={dialog.item}
        onClose={actions.close} onDelete={() => {
          if (dialog.item.inUse) throw new Error("departmentInUse");
          actions.remove(dialog.item.id);
        }} />;
      return null;
    }}
  />;
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
