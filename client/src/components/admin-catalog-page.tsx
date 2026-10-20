"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AppIcon } from "@/components/app-icon";

export type CatalogSort = { field: string; direction: "asc" | "desc" } | null;
export type CatalogDialog<T> = { type: "create" } | { type: "edit" | "delete"; item: T } | null;

export type CatalogActions<T> = {
  items: T[];
  create: (item: T) => Promise<void>;
  update: (item: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
  close: () => void;
};

export type CatalogColumn<T> = {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
};

const PAGE_SIZE = 10;
const wideRow = "grid grid-cols-[32%_32%_minmax(0,1fr)_40px] items-center border-b border-[var(--border)] px-4 text-sm leading-5 tracking-[.15px] text-[var(--text)] max-[900px]:grid-cols-[46%_minmax(0,1fr)_40px] max-[600px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] max-[600px]:pr-0 max-[600px]:pl-2";
const compactRow = "grid grid-cols-[minmax(0,1fr)_40px] items-center border-b border-[var(--border)] px-4 text-sm leading-5 tracking-[.15px] text-[var(--text)] max-[600px]:grid-cols-[minmax(0,1fr)_32px] max-[600px]:pr-0 max-[600px]:pl-2";
const projectRow = "grid min-w-[780px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)_130px_130px_48px] items-start gap-3 border-b border-[var(--border)] px-4 text-sm text-[var(--text)]";
const catalogState = "grid min-h-[73px] items-center border-b border-[var(--border)] px-4 text-sm text-[var(--muted)] [&_p]:m-0 [&_button]:mt-2 [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-1 [&_button]:text-[var(--red)]";

export function AdminCatalogPage<T extends { id: string; name: string }>({
  singular, plural, layout, initialItems, loadItems, createItem, updateItem, deleteItem, columns, filterAndSort, renderDialog,
}: {
  singular: string;
  plural: string;
  layout: "wide" | "compact" | "projects";
  initialItems: T[];
  loadItems?: () => Promise<T[]>;
  createItem?: (item: T) => Promise<T>;
  updateItem?: (item: T) => Promise<T>;
  deleteItem?: (id: string) => Promise<void>;
  columns: CatalogColumn<T>[];
  filterAndSort: (items: T[], search: string, sort: CatalogSort) => T[];
  renderDialog: ComponentType<{ dialog: CatalogDialog<T>; actions: CatalogActions<T> }>;
}) {
  const Dialog = renderDialog;
  const [items, setItems] = useState(initialItems);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(loadItems ? "loading" : "ready");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CatalogSort>(null);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<CatalogDialog<T>>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const createTrigger = useRef<HTMLButtonElement>(null);
  const matching = useMemo(() => filterAndSort(items, search, sort), [items, search, sort, filterAndSort]);
  const pageCount = Math.ceil(matching.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const visible = matching.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rowClass = layout === "wide" ? wideRow : layout === "projects" ? projectRow : compactRow;
  const stateClass = layout === "projects" ? `${catalogState} min-w-[780px] py-6` : catalogState;

  useEffect(() => {
    if (!loadItems) return;
    let active = true;
    void loadItems().then((loaded) => {
      if (active) { setItems(loaded); setLoadState("ready"); }
    }).catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
  }, [loadItems]);

  function retryLoad() {
    if (!loadItems) return;
    setLoadState("loading");
    void loadItems().then((loaded) => {
      setItems(loaded);
      setLoadState("ready");
    }).catch(() => setLoadState("error"));
  }

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

  const actions: CatalogActions<T> = {
    items,
    async create(item) {
      const saved = createItem ? await createItem(item) : item;
      setItems((current) => [...current, saved]);
      setSearch("");
      setSort(null);
      setPage(Math.ceil((items.length + 1) / PAGE_SIZE));
    },
    async update(item) {
      const saved = updateItem ? await updateItem(item) : item;
      const index = items.findIndex((current) => current.id === item.id);
      setItems((current) => current.map((value) => value.id === item.id ? saved : value));
      setSearch("");
      setSort(null);
      setPage(Math.floor(Math.max(index, 0) / PAGE_SIZE) + 1);
    },
    async remove(id) {
      if (deleteItem) await deleteItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
    },
    close: closeDialog,
  };

  return <section className="w-full" aria-label={`${plural} catalog`}>
    <div className="flex min-h-14 items-start justify-between gap-4 px-5 pt-1 pb-1.5 max-[600px]:px-0">
      <label className="flex h-[46px] w-80 items-center gap-2.5 rounded-full border border-[#aeaeae] px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--red)] max-[900px]:w-[276px] max-[600px]:w-[min(320px,100%)] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-base [&_input]:leading-[23px] [&_input]:tracking-[.15px] [&_input]:text-[var(--text)] [&_input]:outline-none [&_input]:placeholder:text-[var(--placeholder)] shrink-0">
        <AppIcon name="search" />
        <span className="sr-only">Search {plural.toLowerCase()} by {singular === "Project" ? "name or domain" : "name"}</span>
        <input type="search" placeholder="Search" value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); setOpenMenuId(null); }} />
      </label>
      <button type="button" ref={createTrigger} className="flex h-[46px] items-center gap-3.5 border-0 bg-transparent px-[18px] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[var(--red)] uppercase max-[900px]:px-1 max-[900px]:[&>span]:hidden shrink-0 disabled:cursor-default disabled:opacity-100"
        aria-label={`Create ${singular.toLowerCase()}`} onClick={() => { menuTrigger.current = null; setDialog({ type: "create" }); }}>
        <AppIcon name="plus" /><span>Create {singular.toLowerCase()}</span>
      </button>
    </div>

    <div className={`w-full ${layout === "projects" ? "overflow-x-auto" : ""}`} role="table" aria-label={plural} aria-busy={loadState === "loading"}>
      <div className={`${rowClass} h-[54px] font-medium`} role="row">
        {columns.map((column) => {
          const direction = sort?.field === column.key ? sort.direction : null;
          return <div key={column.key} role="columnheader" className={column.className}
            aria-sort={column.sortable ? direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none" : undefined}>
            {column.sortable ? <button type="button" className="inline-flex items-center justify-self-start gap-1 border-0 bg-transparent p-0 text-inherit"
              aria-label={`Sort by ${column.label === "ISO" ? "ISO" : column.label.toLowerCase()}${direction ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
              onClick={() => {
                setSort({ field: column.key, direction: direction === "asc" ? "desc" : "asc" });
                setPage(1);
                setOpenMenuId(null);
              }}>
              {column.label} <AppIcon name="sort" className={direction === "desc" ? "ml-1.5 !size-[18px] align-middle rotate-180" : "ml-1.5 !size-[18px] align-middle"} />
            </button> : column.label}
          </div>;
        })}
        <span role="columnheader"><span className="sr-only">Actions</span></span>
      </div>

      {loadState === "loading" ? <div className={stateClass} role="row"><p role="cell" aria-live="polite">Loading {plural.toLowerCase()}…</p></div>
        : loadState === "error" ? <div className={stateClass} role="row"><div role="cell">
          <p role="alert">Could not load {plural.toLowerCase()}.</p>
          <button type="button" onClick={retryLoad}>Retry</button>
        </div></div>
          : visible.length === 0 ? <div className={stateClass} role="row"><p role="cell">No {plural.toLowerCase()} found</p></div>
            : visible.map((item) => <div className={`${rowClass} min-h-[73px] [&>span]:min-w-0 [&>span]:wrap-anywhere`} role="row" key={item.id}>
              {columns.map((column) => <span key={column.key} role="cell" className={column.className}>{column.render(item)}</span>)}
              <div className="relative justify-self-end" role="cell" ref={openMenuId === item.id ? menuRoot : undefined}>
                <button type="button" className="grid h-6 w-8 place-items-center justify-self-end border-0 bg-transparent p-0 text-[var(--muted)] disabled:cursor-default disabled:opacity-100" aria-label={`Actions for ${item.name}`}
                  aria-haspopup="menu" aria-expanded={openMenuId === item.id}
                  onClick={(event) => { menuTrigger.current = event.currentTarget; setOpenMenuId((value) => value === item.id ? null : item.id); }}>
                  <AppIcon name="more" />
                </button>
                {openMenuId === item.id && <div className="absolute top-7 right-0 z-5 w-[132px] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_4px_12px_#0003] [&>a]:block [&>a]:w-full [&>a]:px-4 [&>a]:py-[9px] [&>a]:text-left [&>a]:text-sm [&>a]:leading-5 [&>a]:text-[var(--text)] [&>a]:no-underline [&>a:hover]:bg-[var(--sidebar-active)] [&>button]:block [&>button]:w-full [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-4 [&>button]:py-[9px] [&>button]:text-left [&>button]:text-sm [&>button]:leading-5 [&>button]:text-[var(--text)] [&>button:hover]:bg-[var(--sidebar-active)]" role="menu" aria-label={`Actions for ${item.name}`}
                  onKeyDown={(event) => {
                    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const menuItems = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                    const at = menuItems.indexOf(document.activeElement as HTMLElement);
                    menuItems[event.key === "Home" ? 0 : event.key === "End" ? menuItems.length - 1 : event.key === "ArrowDown" ? (at + 1) % menuItems.length : (at - 1 + menuItems.length) % menuItems.length]?.focus();
                  }}>
                  <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setDialog({ type: "edit", item }); }}>Edit</button>
                  <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setDialog({ type: "delete", item }); }}>Delete</button>
                </div>}
              </div>
            </div>)}
    </div>

    {loadState === "ready" && pageCount > 1 && <nav className="flex justify-center gap-2 py-6 [&>button]:h-9 [&>button]:min-w-9 [&>button]:rounded [&>button]:border [&>button]:border-[var(--border)] [&>button]:bg-transparent [&>button]:text-[var(--text)] [&>button[aria-current=page]]:border-[var(--red)] [&>button[aria-current=page]]:bg-[var(--red)] [&>button[aria-current=page]]:text-[#f5f5f7] [&>button:disabled]:cursor-default [&>button:disabled]:opacity-40" aria-label={`${singular} pages`}>
      <button type="button" disabled={currentPage === 1} aria-label="Previous page" onClick={() => setPage(currentPage - 1)}>‹</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number}
        aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined}
        onClick={() => { setPage(number); setOpenMenuId(null); }}>{number}</button>)}
      <button type="button" disabled={currentPage === pageCount} aria-label="Next page" onClick={() => setPage(currentPage + 1)}>›</button>
    </nav>}
    <Dialog dialog={dialog} actions={actions} />
  </section>;
}
