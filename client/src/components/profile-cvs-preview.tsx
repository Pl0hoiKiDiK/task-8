"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { CvDeleteDialog, CvFormDialog } from "@/components/profile-cv-dialogs";
import { useCvPreviewData, type CvRecord } from "@/components/profile-cvs-data";
import { filterAndSortCvs, type CvSortDirection } from "@/lib/cv-list";

type ActiveDialog = { type: "create" } | { type: "edit" | "delete"; cv: CvRecord } | null;
type CvView = "profile" | "admin" | "employee" | "user";
const cvBasePath: Record<CvView, string> = {
  profile: "/admin/profile/cvs",
  admin: "/admin/cvs",
  employee: "/cvs",
  user: "/admin/cvs",
};
const PAGE_SIZE = 5;

export function ProfileCvsPreview({ view = "profile", ownerId }: { view?: CvView; ownerId?: string }) {
  const { cvs, currentUserId, loadState, reload, createCv, updateCv, deleteCv } = useCvPreviewData();
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<CvSortDirection>("asc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [page, setPage] = useState(1);
  const menuRoot = useRef<HTMLDivElement>(null);
  const scopedCvs = useMemo(() => view === "admin" ? cvs : cvs.filter((cv) => cv.ownerId === (ownerId ?? currentUserId)), [cvs, currentUserId, ownerId, view]);
  const matchingCvs = useMemo(() => filterAndSortCvs(scopedCvs, search, direction, view === "admin"), [scopedCvs, search, direction, view]);
  const pageCount = Math.ceil(matchingCvs.length / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const visibleCvs = view === "profile" ? matchingCvs : matchingCvs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!openMenuId) return;
    menuRoot.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();

    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRoot.current?.contains(event.target)) setOpenMenuId(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      menuRoot.current?.querySelector<HTMLButtonElement>("[data-cv-id]")?.focus();
      setOpenMenuId(null);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenuId]);

  function openAction(type: "edit" | "delete", cv: CvRecord) {
    setOpenMenuId(null);
    setDialog({ type, cv });
  }

  return (
    <div>
      <section aria-label="CVs">
        <div className="flex min-h-14 items-start justify-between gap-4 px-5 pt-1 max-[600px]:px-2">
          <label className="flex h-[46px] w-80 items-center gap-2.5 rounded-full border border-[#aeaeae] px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--red)] max-[900px]:w-[276px] max-[600px]:w-[min(320px,100%)] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-base [&_input]:leading-[23px] [&_input]:tracking-[.15px] [&_input]:text-[var(--text)] [&_input]:outline-none [&_input]:placeholder:text-[var(--placeholder)] shrink-0">
            <AppIcon name="search" />
            <span className="sr-only">{view === "admin" ? "Search CVs by name or employee email" : "Search CVs by name"}</span>
            <input type="search" placeholder="Search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </label>
          <button className="flex h-[46px] items-center gap-3.5 border-0 bg-transparent px-[18px] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[var(--red)] uppercase max-[900px]:px-1 max-[900px]:[&>span]:hidden shrink-0 disabled:cursor-default disabled:opacity-100" type="button" aria-label="Create CV" onClick={() => setDialog({ type: "create" })}>
            <AppIcon name="plus" /><span>Create CV</span>
          </button>
        </div>

        <div className="w-full overflow-x-auto"><div className="min-w-[720px]">
        <div className="grid min-h-[58px] grid-cols-[35%_29%_minmax(0,1fr)_40px] items-center border-b border-[var(--border)] px-4 text-sm font-medium leading-6 tracking-[.15px] text-[var(--text)]">
          <button
            type="button"
            className="inline-flex items-center justify-self-start gap-1 border-0 bg-transparent p-0 text-inherit"
            aria-label={`Sort by name, currently ${direction === "asc" ? "ascending" : "descending"}`}
            onClick={() => { setDirection((current) => current === "asc" ? "desc" : "asc"); setPage(1); }}
          >
            Name <AppIcon name="sort" className={direction === "desc" ? "ml-1.5 !size-[18px] align-middle rotate-180" : "ml-1.5 !size-[18px] align-middle"} />
          </button>
          <span>Education</span>
          <span>Employee</span>
        </div>

        <div aria-busy={loadState === "loading"}>
          {loadState === "loading" ? <p className="m-0 px-4 py-14 text-center text-base leading-6 text-[var(--text)]" role="status">Loading CVs…</p>
          : loadState === "error" ? <div className="px-4 py-14 text-center text-base leading-6 text-[var(--text)]" role="alert">Could not load CVs. <button type="button" onClick={() => { void reload().catch(() => undefined); }}>Retry</button></div>
          : visibleCvs.length === 0 ? (
            <p className="m-0 px-4 py-14 text-center text-base leading-6 text-[var(--text)]" role="status">{search || view !== "employee" ? "No CVs found" : "You have no CVs yet"}</p>
          ) : visibleCvs.map((cv) => (
            <article className="border-b border-[var(--border)] px-4 pt-6 pb-4 [&>p]:mt-6 [&>p]:mb-0 [&>p]:text-base [&>p]:leading-6 [&>p]:tracking-[.15px] [&>p]:text-[var(--text)] [&>p]:opacity-50 max-[900px]:[&>p]:mt-4" key={cv.id} aria-label={cv.name}>
              <div className="grid min-h-6 grid-cols-[35%_29%_minmax(0,1fr)_40px] items-start text-sm leading-5 tracking-[.15px] text-[var(--text)] [&>h2]:m-0 [&>h2]:min-w-0 [&>h2]:max-w-80 [&>h2]:wrap-anywhere [&>h2]:pr-4 [&>h2]:font-[inherit] [&>span]:min-w-0 [&>span]:wrap-anywhere">
                <h2>{cv.name}</h2>
                <span>{cv.education}</span>
                <span>{cv.employee}</span>
                <div className="relative justify-self-end" ref={openMenuId === cv.id ? menuRoot : undefined}>
                  <button
                    type="button"
                    className="grid h-6 w-8 place-items-center justify-self-end border-0 bg-transparent p-0 text-[var(--muted)] disabled:cursor-default disabled:opacity-100"
                    data-cv-id={cv.id}
                    aria-label={`Actions for ${cv.name}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === cv.id}
                    onClick={() => setOpenMenuId((current) => current === cv.id ? null : cv.id)}
                  >
                    <AppIcon name="more" />
                  </button>
                  {openMenuId === cv.id && (
                    <div
                      className="absolute top-7 right-0 z-5 w-[132px] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_4px_12px_#0003] [&>a]:block [&>a]:w-full [&>a]:px-4 [&>a]:py-[9px] [&>a]:text-left [&>a]:text-sm [&>a]:leading-5 [&>a]:text-[var(--text)] [&>a]:no-underline [&>a:hover]:bg-[var(--sidebar-active)] [&>button]:block [&>button]:w-full [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-4 [&>button]:py-[9px] [&>button]:text-left [&>button]:text-sm [&>button]:leading-5 [&>button]:text-[var(--text)] [&>button:hover]:bg-[var(--sidebar-active)]"
                      role="menu"
                      aria-label={`Actions for ${cv.name}`}
                      onKeyDown={(event) => {
                        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
                        event.preventDefault();
                        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'));
                        const current = items.indexOf(document.activeElement as HTMLElement);
                        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
                          event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
                        items[next]?.focus();
                      }}
                    >
                      <Link role="menuitem" href={`${cvBasePath[view]}/${encodeURIComponent(cv.id)}`} onClick={() => setOpenMenuId(null)}>View</Link>
                      <button type="button" role="menuitem" onClick={() => openAction("edit", cv)}>Edit</button>
                      <button type="button" role="menuitem" onClick={() => openAction("delete", cv)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
              <p>{cv.description}</p>
            </article>
          ))}
        </div>
        </div></div>
        {view !== "profile" && pageCount > 1 && (
          <nav className="flex justify-center gap-2 py-6 [&>button]:h-9 [&>button]:min-w-9 [&>button]:rounded [&>button]:border [&>button]:border-[var(--border)] [&>button]:bg-transparent [&>button]:text-[var(--text)] [&>button[aria-current=page]]:border-[var(--red)] [&>button[aria-current=page]]:bg-[var(--red)] [&>button[aria-current=page]]:text-[#f5f5f7] [&>button:disabled]:cursor-default [&>button:disabled]:opacity-40" aria-label="CV pages">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">‹</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>
            ))}
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">›</button>
          </nav>
        )}
      </section>

      {dialog?.type === "create" && (
        <CvFormDialog onClose={() => setDialog(null)} onSave={(fields) => createCv(fields, ownerId)} />
      )}
      {dialog?.type === "edit" && (
        <CvFormDialog cv={dialog.cv} saveLabel={view === "profile" ? "Update" : "Save"} onClose={() => setDialog(null)} onSave={(fields) => updateCv(dialog.cv.id, fields)} />
      )}
      {dialog?.type === "delete" && (
        <CvDeleteDialog cv={dialog.cv} onClose={() => setDialog(null)} onConfirm={() => deleteCv(dialog.cv.id)} />
      )}
    </div>
  );
}
