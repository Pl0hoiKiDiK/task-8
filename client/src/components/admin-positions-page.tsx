"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useApolloClient } from "@apollo/client/react";
import { AdminCatalogPage } from "@/components/admin-catalog-page";
import { SkillDialog } from "@/components/skill-dialogs";
import { useCvPreviewData } from "@/components/profile-cvs-data";
import {
  positionNameExists,
  filterAndSortPositions,
  type AdminPosition,
} from "@/components/admin-positions-data";
import { CREATE_POSITION, DELETE_POSITION, loadAllCatalogItems, POSITIONS_QUERY, UPDATE_POSITION } from "@/lib/catalog-api";

export function AdminPositionsPage() {
  const client = useApolloClient();
  const { reloadProjectRoles } = useCvPreviewData();
  const loadItems = useCallback(() => loadAllCatalogItems(client, POSITIONS_QUERY, "positions"), [client]);
  const refreshRoles = () => { void reloadProjectRoles().catch(() => undefined); };
  return <AdminCatalogPage<AdminPosition>
    singular="Position" plural="Positions" layout="compact"
    initialItems={[]} loadItems={loadItems}
    createItem={async ({ name }) => {
      const { data } = await client.mutate<{ createPosition: AdminPosition }>({ mutation: CREATE_POSITION, variables: { position: { name } } });
      if (!data?.createPosition) throw new Error("Position was not created");
      refreshRoles();
      return data.createPosition;
    }}
    updateItem={async ({ id, name }) => {
      const { data } = await client.mutate<{ updatePosition: AdminPosition }>({ mutation: UPDATE_POSITION, variables: { position: { positionId: id, name } } });
      if (!data?.updatePosition) throw new Error("Position was not updated");
      refreshRoles();
      return data.updatePosition;
    }}
    deleteItem={async (id) => {
      const { data } = await client.mutate<{ deletePosition: { affected: number } }>({ mutation: DELETE_POSITION, variables: { position: { positionId: id } } });
      if (!data?.deletePosition.affected) throw new Error("Position was not deleted");
      refreshRoles();
    }}
    columns={[{ key: "name", label: "Name", sortable: true, render: (item) => item.name }]}
    filterAndSort={(items, search, sort) => filterAndSortPositions(items, search, sort?.direction ?? null)}
    renderDialog={({ dialog, actions }) => {
      if (dialog?.type === "create") return <AdminPositionFormDialog key="create" positions={actions.items}
        onClose={actions.close} onSave={(name) => actions.create({ id: crypto.randomUUID(), name })} />;
      if (dialog?.type === "edit") return <AdminPositionFormDialog key={dialog.item.id} position={dialog.item}
        positions={actions.items} onClose={actions.close}
        onSave={(name) => actions.update({ ...dialog.item, name })} />;
      if (dialog?.type === "delete") return <AdminPositionDeleteDialog key={dialog.item.id} position={dialog.item}
        onClose={actions.close} onDelete={() => actions.remove(dialog.item.id)} />;
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
    <form className="mt-6 flex flex-col gap-9 [&>div:last-child]:-mt-2.5" onSubmit={submit} noValidate>
      <div className="relative [&>label]:absolute [&>label]:-top-4 [&>label]:left-3 [&>label]:text-xs [&>label]:leading-4 [&>label]:text-[var(--muted)] [&>input]:block [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[var(--border)] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-sm [&>input]:leading-6 [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:placeholder:text-[var(--placeholder)] [&>[aria-invalid=true]]:border-[var(--red)]">
        <label htmlFor="admin-position-name" className={name ? undefined : "sr-only"}>Position</label>
        <input id="admin-position-name" type="text" placeholder="Position" value={name} disabled={saving}
          aria-invalid={touched && Boolean(error)} aria-describedby={touched && error ? "admin-position-name-error" : undefined}
          onBlur={(event) => {
            if (event.relatedTarget instanceof HTMLElement && event.currentTarget.closest("dialog")?.contains(event.relatedTarget)) setTouched(true);
          }}
          onChange={(event) => { setName(event.target.value); setTouched(true); setSystemError(""); }} />
        {touched && error && <span id="admin-position-name-error" className="mt-1 block text-xs leading-4 text-[var(--red)]">{error}</span>}
      </div>
      {systemError && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{systemError}</p>}
      <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
        <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={saving} onClick={onClose}>Cancel</button>
        <button type="submit" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={saving}>
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
    <p className={`mt-6 mb-7 text-base leading-6 tracking-[.15px]${error ? " mb-2" : ""}`}>
      Are you sure you want to delete position <strong>{position.name}</strong>?
    </p>
    {error && <p className="mt-1 block text-xs leading-4 text-[var(--red)]" role="alert">{error}</p>}
    <div className="flex justify-end gap-6 max-[600px]:gap-3 [&>button]:h-12 max-[600px]:[&>button]:w-1/2 [&>button]:w-40 [&>button]:rounded-3xl [&>button]:text-sm [&>button]:font-medium [&>button]:leading-[24.5px] [&>button]:tracking-[.4px] [&>button]:uppercase">
      <button type="button" className="border border-[var(--text)] bg-transparent text-[var(--text)]" disabled={deleting} onClick={onClose}>Cancel</button>
      <button type="button" className="border-0 bg-[var(--red)] text-[#f5f5f7] disabled:cursor-not-allowed" disabled={deleting} onClick={confirm}>
        {deleting ? "Deleting..." : "Confirm"}
      </button>
    </div>
  </SkillDialog>;
}
