"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { Pagination } from "@/components/pagination";
import { UserDeleteDialog, UserFormDialog } from "@/components/user-dialogs";
import { getApiErrorMessage } from "@/lib/common/graphql-errors";
import type { UserListItem } from "@/lib/users/api/graphql";
import { useCreateUser, useDeleteUser, useUpdateUser } from "@/lib/users/hooks/use-user-mutations";
import { useUserOptions } from "@/lib/users/hooks/use-user-options";
import { SORTABLE_BY_SERVER, useUsersList, type UserSortKey } from "@/lib/users/hooks/use-user-list";
import { userFullName, userInitial } from "@/lib/users/models/display";

type ActiveDialog = { type: "create" } | { type: "update" | "delete"; user: UserListItem } | null;

const COLUMN_COUNT = 7;
const menuLinkClass = "block w-full px-3.5 py-[7px] text-left text-sm leading-[18px] text-(--text) no-underline";

const sortableColumns: { key: UserSortKey; label: string; className?: string }[] = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
];

export function EmployeesPreview({ admin = false }: { admin?: boolean }) {
  const list = useUsersList();
  const options = useUserOptions();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const detailsBase = admin ? "/admin/employees" : "/employees";

  useEffect(() => {
    if (!openActionsFor) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRoot.current?.contains(event.target)) setOpenActionsFor(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      menuRoot.current?.querySelector<HTMLButtonElement>(".employee-row-action")?.focus();
      setOpenActionsFor(null);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openActionsFor]);

  function openAction(type: "update" | "delete", user: UserListItem) {
    setOpenActionsFor(null);
    setDialog({ type, user });
  }

  function sortHeader(key: UserSortKey, label: string, className?: string) {
    if (!SORTABLE_BY_SERVER[key]) return <th key={key} className={className}>{label}</th>;
    const active = list.sort?.by === key;
    const order = active ? (list.sort?.order === "asc" ? "ascending" : "descending") : "none";
    return (
      <th key={key} className={className} aria-sort={order}>
        <button type="button" className="employees-sort" onClick={() => list.toggleSort(key)}>
          {label}{" "}
          <AppIcon name="sort" className={active && list.sort?.order === "desc" ? "sort-indicator profile-cvs-sort--desc" : "sort-indicator"} />
        </button>
      </th>
    );
  }

  const showEmpty = !list.loading && !list.error && list.users.length === 0;


  return (
    <>
      <div className="employees-toolbar">
        <label className="search-field">
          <AppIcon name="search" />
          <span className="sr-only">Search employees</span>
          <input type="search" placeholder="Search" value={list.searchInput} onChange={(event) => list.setSearchInput(event.target.value)} />
        </label>
        {admin && (
          <button className="create-action" type="button" aria-label="Create user" onClick={() => setDialog({ type: "create" })}>
            <AppIcon name="plus" /><span>Create user</span>
          </button>
        )}
      </div>

      <table className="employees-table" aria-busy={list.loading}>
        <thead>
          <tr>
            <th aria-label="Avatar" />
            {sortableColumns.map((column) => sortHeader(column.key, column.label, column.className))}
            <th className="employee-email">Email</th>
            {sortHeader("department", "Department", "employee-department")}
            {sortHeader("position", "Position", "employee-position")}
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {list.error ? (
            <tr>
              <td colSpan={COLUMN_COUNT} role="alert">
                <p>Failed to load employees. {getApiErrorMessage(list.error)}</p>
                <button type="button" onClick={() => void list.refetch()}>Retry</button>
              </td>
            </tr>
          ) : (
            list.users.map((person) => {
              const name = userFullName(person) || person.email;
              return (
                <tr key={person.id}>
                  <td>
                    <span className="employee-avatar">
                      {person.profile.avatar
                        ? <img src={person.profile.avatar} alt="" />
                        : userInitial(person)}
                    </span>
                  </td>
                  <td>{person.profile.first_name}</td>
                  <td>{person.profile.last_name}</td>
                  <td className="employee-email">{person.email}</td>
                  <td className="employee-department">{person.department?.name}</td>
                  <td className="employee-position">{person.position?.name}</td>
                  <td>
                    {admin ? (
                      <div className="employee-actions" ref={openActionsFor === person.id ? menuRoot : undefined}>
                        <button
                          className="employee-row-action"
                          type="button"
                          aria-label={`Actions for ${name}`}
                          aria-haspopup="menu"
                          aria-expanded={openActionsFor === person.id}
                          onClick={() => setOpenActionsFor((current) => current === person.id ? null : person.id)}
                        >
                          <AppIcon name="more" />
                        </button>
                        {openActionsFor === person.id && (
                          <div className="employee-actions-menu" role="menu" aria-label={`Actions for ${name}`}>
                            <Link role="menuitem" className={menuLinkClass} href={`${detailsBase}/${encodeURIComponent(person.id)}`} onClick={() => setOpenActionsFor(null)}>View</Link>
                            <button type="button" role="menuitem" onClick={() => openAction("update", person)}>Update</button>
                            <button type="button" role="menuitem" onClick={() => openAction("delete", person)}>Delete</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link className="employee-row-action employee-row-action--arrow" href={`${detailsBase}/${encodeURIComponent(person.id)}`} aria-label={`Open ${name}`}>
                        <AppIcon name="chevron" />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })
          )}
          {showEmpty && (
            <tr>
              <td colSpan={COLUMN_COUNT} role="status">No users found</td>
            </tr>
          )}
          {list.loading && (
            <tr>
              <td colSpan={COLUMN_COUNT} role="status">Loading...</td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination page={list.page} pageCount={list.totalPages} onChange={list.setPage} label="Employee pages" />

      {dialog?.type === "create" && (
        <UserFormDialog
          mode="create"
          departments={options.departments}
          positions={options.positions}
          optionsLoading={options.loading}
          optionsError={Boolean(options.error)}
          onRetryOptions={() => void options.refetch()}
          onClose={() => setDialog(null)}
          onSubmit={createUser}
        />
      )}
      {dialog?.type === "update" && (
        <UserFormDialog
          mode="update"
          user={dialog.user}
          departments={options.departments}
          positions={options.positions}
          optionsLoading={options.loading}
          optionsError={Boolean(options.error)}
          onRetryOptions={() => void options.refetch()}
          onClose={() => setDialog(null)}
          onSubmit={(fields) => updateUser(dialog.user.id, fields)}
        />
      )}
      {dialog?.type === "delete" && (
        <UserDeleteDialog user={dialog.user} onClose={() => setDialog(null)} onConfirm={() => deleteUser(dialog.user.id)} />
      )}
    </>
  );
}
