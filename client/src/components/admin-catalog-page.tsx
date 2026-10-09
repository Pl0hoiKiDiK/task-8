"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AppIcon } from "@/components/app-icon";

export type CatalogSort = { field: string; direction: "asc" | "desc" } | null;
export type CatalogDialog<T> = { type: "create" } | { type: "edit" | "delete"; item: T } | null;

export type CatalogActions<T> = {
  items: T[];
  create: (item: T) => void;
  update: (item: T) => void;
  remove: (id: string) => void;
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

export function AdminCatalogPage<T extends { id: string; name: string }>({
  singular, plural, className, initialItems, loadItems, columns, filterAndSort, renderDialog,
}: {
  singular: string;
  plural: string;
  className: string;
  initialItems: T[];
  loadItems?: () => Promise<T[]>;
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
    create(item) {
      setItems((current) => [...current, item]);
      setSearch("");
      setSort(null);
      setPage(Math.ceil((items.length + 1) / PAGE_SIZE));
    },
    update(item) {
      const index = items.findIndex((current) => current.id === item.id);
      setItems((current) => current.map((value) => value.id === item.id ? item : value));
      setSearch("");
      setSort(null);
      setPage(Math.floor(Math.max(index, 0) / PAGE_SIZE) + 1);
    },
    remove(id) { setItems((current) => current.filter((item) => item.id !== id)); },
    close: closeDialog,
  };

  return <section className={`${className}-page`} aria-label={`${plural} catalog`}>
    <div className={`profile-cvs-toolbar ${className}-toolbar`}>
      <label className="search-field profile-cvs-search">
        <AppIcon name="search" />
        <span className="sr-only">Search {plural.toLowerCase()} by name</span>
        <input type="search" placeholder="Search" value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); setOpenMenuId(null); }} />
      </label>
      <button type="button" ref={createTrigger} className="create-action profile-cvs-create"
        aria-label={`Create ${singular.toLowerCase()}`} onClick={() => { menuTrigger.current = null; setDialog({ type: "create" }); }}>
        <AppIcon name="plus" /><span>Create {singular.toLowerCase()}</span>
      </button>
    </div>

    <div className={`${className}-table`} role="table" aria-label={plural} aria-busy={loadState === "loading"}>
      <div className={`${className}-row ${className}-heading`} role="row">
        {columns.map((column) => {
          const direction = sort?.field === column.key ? sort.direction : null;
          return <div key={column.key} role="columnheader" className={column.className}
            aria-sort={column.sortable ? direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none" : undefined}>
            {column.sortable ? <button type="button" className="profile-cvs-sort"
              aria-label={`Sort by ${column.label === "ISO" ? "ISO" : column.label.toLowerCase()}${direction ? `, currently ${direction === "asc" ? "ascending" : "descending"}` : ""}`}
              onClick={() => {
                setSort({ field: column.key, direction: direction === "asc" ? "desc" : "asc" });
                setPage(1);
                setOpenMenuId(null);
              }}>
              {column.label} <AppIcon name="sort" className={direction === "desc" ? "sort-indicator profile-cvs-sort--desc" : "sort-indicator"} />
            </button> : column.label}
          </div>;
        })}
        <span role="columnheader"><span className="sr-only">Actions</span></span>
      </div>

      {loadState === "loading" ? <div className={`${className}-state`} role="row"><p role="cell" aria-live="polite">Loading {plural.toLowerCase()}…</p></div>
        : loadState === "error" ? <div className={`${className}-state`} role="row"><div role="cell">
          <p role="alert">Could not load {plural.toLowerCase()}.</p>
          <button type="button" onClick={retryLoad}>Retry</button>
        </div></div>
          : visible.length === 0 ? <div className={`${className}-state`} role="row"><p role="cell">No {plural.toLowerCase()} found</p></div>
            : visible.map((item) => <div className={`${className}-row ${className}-item`} role="row" key={item.id}>
              {columns.map((column) => <span key={column.key} role="cell" className={column.className}>{column.render(item)}</span>)}
              <div className="profile-cv-actions" role="cell" ref={openMenuId === item.id ? menuRoot : undefined}>
                <button type="button" className="profile-cv-more" aria-label={`Actions for ${item.name}`}
                  aria-haspopup="menu" aria-expanded={openMenuId === item.id}
                  onClick={(event) => { menuTrigger.current = event.currentTarget; setOpenMenuId((value) => value === item.id ? null : item.id); }}>
                  <AppIcon name="more" />
                </button>
                {openMenuId === item.id && <div className="profile-cv-actions-menu" role="menu" aria-label={`Actions for ${item.name}`}
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

    {loadState === "ready" && pageCount > 1 && <nav className="profile-cvs-pagination" aria-label={`${singular} pages`}>
      <button type="button" disabled={currentPage === 1} aria-label="Previous page" onClick={() => setPage(currentPage - 1)}>‹</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number}
        aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined}
        onClick={() => { setPage(number); setOpenMenuId(null); }}>{number}</button>)}
      <button type="button" disabled={currentPage === pageCount} aria-label="Next page" onClick={() => setPage(currentPage + 1)}>›</button>
    </nav>}
    <Dialog dialog={dialog} actions={actions} />
  </section>;
}
