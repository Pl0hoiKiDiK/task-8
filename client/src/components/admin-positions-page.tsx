"use client";

import { useState, type FormEvent } from "react";
import { AdminCatalogPage } from "@/components/admin-catalog-page";
import { SkillDialog } from "@/components/skill-dialogs";
import {
  positionNameExists,
  filterAndSortPositions,
  initialAdminPositions,
  type AdminPosition,
} from "@/components/admin-positions-data";

export function AdminPositionsPage() {
  return <AdminCatalogPage<AdminPosition>
    singular="Position" plural="Positions" className="admin-positions"
    initialItems={initialAdminPositions}
    columns={[{ key: "name", label: "Name", sortable: true, render: (item) => item.name }]}
    filterAndSort={(items, search, sort) => filterAndSortPositions(items, search, sort?.direction ?? null)}
    renderDialog={({ dialog, actions }) => {
      if (dialog?.type === "create") return <AdminPositionFormDialog key="create" positions={actions.items}
        onClose={actions.close} onSave={(name) => actions.create({ id: crypto.randomUUID(), name })} />;
      if (dialog?.type === "edit") return <AdminPositionFormDialog key={dialog.item.id} position={dialog.item}
        positions={actions.items} onClose={actions.close}
        onSave={(name) => actions.update({ ...dialog.item, name })} />;
      if (dialog?.type === "delete") return <AdminPositionDeleteDialog key={dialog.item.id} position={dialog.item}
        onClose={actions.close} onDelete={() => {
          if (dialog.item.inUse) throw new Error("positionInUse");
          actions.remove(dialog.item.id);
        }} />;
      return null;
    }}
  />;
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
