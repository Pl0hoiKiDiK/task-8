"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { AppIcon } from "@/components/app-icon";
import { EmployeeDialog, type EmployeeDialogState } from "@/components/employee-dialog";
import { EMPLOYEES_QUERY, type Employee, type EmployeeListParams } from "@/lib/employees/api";

const PAGE_SIZE = 10;
type SortField = "first_name" | "last_name" | "department" | "position";
type Sort = { field: SortField; order: "ASC" | "DESC" } | null;
const columns: { field: SortField; label: string; width?: string }[] = [
  { field: "first_name", label: "First Name" },
  { field: "last_name", label: "Last Name" },
  { field: "department", label: "Department", width: "w-[14%]" },
  { field: "position", label: "Position", width: "w-[17%]" },
];
const headerCell = "h-[52px] border-b border-[var(--border)] px-4 text-left text-sm font-medium whitespace-nowrap";
const bodyCell = "h-[73px] border-b border-[var(--border)] px-4 text-sm whitespace-nowrap";

function displayName(employee: Employee) {
  return [employee.profile.first_name, employee.profile.last_name].filter(Boolean).join(" ") || employee.email;
}

export function EmployeeAvatar({ employee, size = 40 }: { employee: Employee; size?: number }) {
  const initials = [employee.profile.first_name, employee.profile.last_name]
    .map((part) => part?.trim().charAt(0) ?? "").join("").toUpperCase() || employee.email.charAt(0).toUpperCase();
  return <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--border)] text-lg text-[var(--surface)]" aria-hidden="true">
    {employee.profile.avatar ? <Image src={employee.profile.avatar} alt="" width={size} height={size} unoptimized className="size-full object-cover" /> : initials}
  </span>;
}

export function EmployeesPreview({ admin = false }: { admin?: boolean }) {
  const prefix = admin ? "/admin" : "";
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<{ employee: Employee; top: number; right: number } | null>(null);
  const [dialog, setDialog] = useState<EmployeeDialogState | null>(null);
  const [extraPages, setExtraPages] = useState<{ key: string; items: Employee[]; error: boolean }>({ key: "", items: [], error: false });
  const [bulkRetry, setBulkRetry] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const createRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuerySearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const client = useApolloClient();
  const localSort = sort?.field === "department" || sort?.field === "position";
  const params: EmployeeListParams = {
    search: querySearch,
    sort_by: localSort ? "created_at" : sort?.field ?? "created_at",
    sort_order: localSort ? "DESC" : sort?.order ?? "DESC",
    page: localSort ? 1 : page,
    limit: localSort ? 100 : PAGE_SIZE,
  };
  const { data, loading: queryLoading, error: queryError, refetch } = useQuery(EMPLOYEES_QUERY, {
    variables: { params }, fetchPolicy: "network-only", notifyOnNetworkStatusChange: true,
  });
  const extraKey = `${querySearch}:${data?.users.total_pages ?? 0}`;

  useEffect(() => {
    if (!localSort || !data || queryLoading || data.users.total_pages <= 1) return;
    let active = true;
    async function loadRemaining() {
      const items: Employee[] = [];
      try {
        for (let nextPage = 2; nextPage <= data!.users.total_pages; nextPage += 1) {
          const result = await client.query({ query: EMPLOYEES_QUERY, variables: { params: {
            search: querySearch, sort_by: "created_at", sort_order: "DESC", page: nextPage, limit: 100,
          } }, fetchPolicy: "network-only" });
          if (!result.data) throw new Error("Could not load employees");
          items.push(...result.data.users.items);
        }
        if (active) setExtraPages({ key: extraKey, items, error: false });
      } catch {
        if (active) setExtraPages({ key: extraKey, items: [], error: true });
      }
    }
    void loadRemaining();
    return () => { active = false; };
  }, [client, data, extraKey, localSort, queryLoading, querySearch, bulkRetry]);

  const bulkPending = Boolean(localSort && data && data.users.total_pages > 1 && extraPages.key !== extraKey);
  const loading = queryLoading || bulkPending;
  const error = queryError || (localSort && extraPages.key === extraKey && extraPages.error);
  const sortedEmployees = localSort && data && !bulkPending && !error
    ? [...data.users.items, ...extraPages.items].sort((left, right) => {
      const first = (sort?.field === "department" ? left.department?.name : left.position?.name) ?? "";
      const second = (sort?.field === "department" ? right.department?.name : right.position?.name) ?? "";
      const difference = first.localeCompare(second, undefined, { sensitivity: "base" });
      return sort?.order === "ASC" ? difference : -difference;
    }) : [];
  const employees = localSort ? sortedEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : data?.users.items ?? [];
  const pageCount = localSort ? Math.ceil((data?.users.total ?? 0) / PAGE_SIZE) : data?.users.total_pages ?? 0;

  useEffect(() => {
    if (loading || pageCount === 0 || page <= pageCount) return;
    const timer = setTimeout(() => setPage(pageCount), 0);
    return () => clearTimeout(timer);
  }, [loading, page, pageCount]);

  useEffect(() => {
    if (!openMenu) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setOpenMenu(null);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenMenu(null); triggerRef.current?.focus(); }
    };
    const closeOnScroll = () => setOpenMenu(null);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [openMenu]);

  function openActions(employee: Employee, trigger: HTMLButtonElement) {
    if (openMenu?.employee.id === employee.id) { setOpenMenu(null); return; }
    triggerRef.current = trigger;
    const rect = trigger.getBoundingClientRect();
    setOpenMenu({ employee, top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 132)), right: Math.max(8, window.innerWidth - rect.right) });
  }

  function closeDialog() {
    setDialog(null);
    requestAnimationFrame(() => (triggerRef.current?.isConnected ? triggerRef.current : createRef.current)?.focus());
  }

  function saved() {
    closeDialog();
    setSearch("");
    setQuerySearch("");
    setSort(null);
    setPage(1);
    void refetch({ params: { search: "", sort_by: "created_at", sort_order: "DESC", page: 1, limit: PAGE_SIZE } });
  }

  function sortBy(field: SortField) {
    setSort({ field, order: sort?.field === field && sort.order === "ASC" ? "DESC" : "ASC" });
    setPage(1);
    setOpenMenu(null);
  }

  const sortHeader = (column: (typeof columns)[number]) => <th key={column.field} scope="col" className={`${headerCell} ${column.width ?? ""}`} aria-sort={sort?.field === column.field ? sort.order === "ASC" ? "ascending" : "descending" : "none"}>
    <button type="button" className="inline-flex items-center gap-1 hover:text-[var(--red)]" onClick={() => sortBy(column.field)}>
      {column.label}<AppIcon name="sort" className={sort?.field === column.field && sort.order === "DESC" ? "rotate-180" : ""} />
    </button>
  </th>;

  return <section aria-label="Employees">
    <div className="flex min-h-14 flex-wrap items-start justify-between gap-4 pl-0 sm:pl-5">
      <label className="flex h-[46px] w-full max-w-80 items-center gap-2.5 rounded-full border border-[var(--border)] px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--red)] sm:w-80">
        <AppIcon name="search" />
        <input className="min-w-0 flex-1 border-0 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--placeholder)]" type="search" placeholder="Search" aria-label="Search employees by first name, last name or email" value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); setOpenMenu(null); }} />
      </label>
      {admin && <button ref={createRef} className="flex h-[46px] items-center gap-3 px-4 text-sm font-medium tracking-[.4px] text-[var(--red)] uppercase hover:opacity-80 active:opacity-65" type="button"
        onClick={() => { triggerRef.current = null; setDialog({ type: "create" }); }}>
        <AppIcon name="plus" /><span>Create user</span>
      </button>}
    </div>

    <div className="w-full overflow-x-auto" aria-busy={loading}>
      <table className="w-full min-w-[840px] table-fixed border-collapse" aria-label="Employees">
        <thead><tr>
          <th scope="col" aria-label="Avatar" className={`${headerCell} w-20`} />
          {columns.slice(0, 2).map(sortHeader)}
          <th scope="col" className={`${headerCell} w-[27%]`}>Email</th>
          {columns.slice(2).map(sortHeader)}
          <th scope="col" aria-label="Actions" className={`${headerCell} w-14 text-right`} />
        </tr></thead>
        <tbody>
          {loading ? <tr><td className="h-20 px-4" colSpan={7} role="status">Loading employees…</td></tr>
            : error ? <tr><td className="h-20 px-4" colSpan={7}><p role="alert">Could not load employees.</p><button type="button" className="mt-2 text-[var(--red)] underline" onClick={() => {
              if (localSort && !queryError) { setExtraPages({ key: "", items: [], error: false }); setBulkRetry((current) => current + 1); }
              else void refetch();
            }}>Retry</button></td></tr>
              : employees.length === 0 ? <tr><td className="h-20 px-4" colSpan={7}>No users found</td></tr>
                : employees.map((employee) => <tr key={employee.id}>
                  <td className={bodyCell}><EmployeeAvatar employee={employee} /></td>
                  <td className={`${bodyCell} truncate`} title={employee.profile.first_name ?? ""}>{employee.profile.first_name || "—"}</td>
                  <td className={`${bodyCell} truncate`} title={employee.profile.last_name ?? ""}>{employee.profile.last_name || "—"}</td>
                  <td className={`${bodyCell} truncate`} title={employee.email}>{employee.email}</td>
                  <td className={`${bodyCell} truncate`} title={employee.department?.name ?? ""}>{employee.department?.name || "—"}</td>
                  <td className={`${bodyCell} truncate`} title={employee.position?.name ?? ""}>{employee.position?.name || "—"}</td>
                  <td className={`${bodyCell} text-right`}>
                    {admin ? <button type="button" className="inline-grid size-10 place-items-center text-[var(--muted)]" aria-label={`Actions for ${displayName(employee)}`}
                      aria-haspopup="menu" aria-expanded={openMenu?.employee.id === employee.id} onClick={(event) => openActions(employee, event.currentTarget)}><AppIcon name="more" /></button>
                      : <Link href={`${prefix}/employees/${employee.id}`} className="inline-grid size-10 place-items-center text-[var(--muted)]" aria-label={`View ${displayName(employee)}`}><AppIcon name="chevron" className="rotate-180" /></Link>}
                  </td>
                </tr>)}
        </tbody>
      </table>
    </div>

    {!loading && !error && pageCount > 1 && <nav className="mt-5 flex items-center justify-center gap-2" aria-label="Employee pages">
      <button className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40" type="button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">‹</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={`rounded border px-3 py-1 ${number === page ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--border)]"}`}
        aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} onClick={() => { setPage(number); setOpenMenu(null); }}>{number}</button>)}
      <button className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40" type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Next page">›</button>
    </nav>}

    {openMenu && createPortal(<div ref={menuRef} role="menu" aria-label={`Actions for ${displayName(openMenu.employee)}`}
      style={{ top: openMenu.top, right: openMenu.right }} className="fixed z-50 min-w-28 rounded-lg border border-[var(--border)] bg-[var(--menu-surface)] p-1 text-[var(--text)] shadow-lg"
      onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
        const index = items.indexOf(document.activeElement as HTMLElement);
        items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length]?.focus();
      }}>
      <Link role="menuitem" href={`${prefix}/employees/${openMenu.employee.id}`} className="block rounded px-3 py-2 text-sm hover:bg-[var(--sidebar-active)]" onClick={() => setOpenMenu(null)}>View</Link>
      <button role="menuitem" type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--sidebar-active)]" onClick={() => { setOpenMenu(null); setDialog({ type: "update", employee: openMenu.employee }); }}>Update</button>
      <button role="menuitem" type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--sidebar-active)]" onClick={() => { setOpenMenu(null); setDialog({ type: "delete", employee: openMenu.employee }); }}>Delete</button>
    </div>, document.body)}

    {dialog && <EmployeeDialog state={dialog} onClose={closeDialog} onSaved={saved} />}
  </section>;
}
