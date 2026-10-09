"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { CvDeleteDialog, CvFormDialog } from "@/components/profile-cv-dialogs";
import { previewEmployeeEmail, useCvPreviewData, type CvRecord } from "@/components/profile-cvs-data";
import { filterAndSortCvs, type CvSortDirection } from "@/lib/cv-list";

type ActiveDialog = { type: "create" } | { type: "edit" | "delete"; cv: CvRecord } | null;
type CvView = "profile" | "admin" | "employee";
const cvBasePath: Record<CvView, string> = {
  profile: "/admin/profile/cvs",
  admin: "/admin/cvs",
  employee: "/cvs",
};
const PAGE_SIZE = 5;

export function ProfileCvsPreview({ view = "profile" }: { view?: CvView }) {
  const { cvs, createCv, updateCv, deleteCv } = useCvPreviewData();
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<CvSortDirection>("asc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [page, setPage] = useState(1);
  const menuRoot = useRef<HTMLDivElement>(null);
  const scopedCvs = useMemo(() => view === "admin" ? cvs : cvs.filter((cv) => cv.employee === previewEmployeeEmail), [cvs, view]);
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
      menuRoot.current?.querySelector<HTMLButtonElement>(".profile-cv-more")?.focus();
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
    <div className="profile-cvs-page">
      <section className="profile-cvs-list" aria-label="CVs">
        <div className="profile-cvs-toolbar">
          <label className="search-field profile-cvs-search">
            <AppIcon name="search" />
            <span className="sr-only">{view === "admin" ? "Search CVs by name or employee email" : "Search CVs by name"}</span>
            <input type="search" placeholder="Search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </label>
          <button className="create-action profile-cvs-create" type="button" aria-label="Create CV" onClick={() => setDialog({ type: "create" })}>
            <AppIcon name="plus" /><span>Create CV</span>
          </button>
        </div>

        <div className="profile-cvs-heading">
          <button
            type="button"
            className="profile-cvs-sort"
            aria-label={`Sort by name, currently ${direction === "asc" ? "ascending" : "descending"}`}
            onClick={() => { setDirection((current) => current === "asc" ? "desc" : "asc"); setPage(1); }}
          >
            Name <AppIcon name="sort" className={direction === "desc" ? "sort-indicator profile-cvs-sort--desc" : "sort-indicator"} />
          </button>
          <span>Education</span>
          <span className="profile-cvs-employee">Employee</span>
        </div>

        <div className="profile-cvs-items">
          {visibleCvs.length === 0 ? (
            <p className="profile-cvs-empty" role="status">{search || view !== "employee" ? "No CVs found" : "You have no CVs yet"}</p>
          ) : visibleCvs.map((cv) => (
            <article className="profile-cv" key={cv.id} aria-label={cv.name}>
              <div className="profile-cv-row">
                <h2>{cv.name}</h2>
                <span>{cv.education}</span>
                <span className="profile-cvs-employee">{cv.employee}</span>
                <div className="profile-cv-actions" ref={openMenuId === cv.id ? menuRoot : undefined}>
                  <button
                    type="button"
                    className="profile-cv-more"
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
                      className="profile-cv-actions-menu"
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
        {view !== "profile" && pageCount > 1 && (
          <nav className="profile-cvs-pagination" aria-label="CV pages">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">‹</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>
            ))}
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">›</button>
          </nav>
        )}
      </section>

      {dialog?.type === "create" && (
        <CvFormDialog onClose={() => setDialog(null)} onSave={(fields) => { createCv(fields); setDialog(null); }} />
      )}
      {dialog?.type === "edit" && (
        <CvFormDialog cv={dialog.cv} saveLabel={view === "profile" ? "Update" : "Save"} onClose={() => setDialog(null)} onSave={(fields) => { updateCv(dialog.cv.id, fields); setDialog(null); }} />
      )}
      {dialog?.type === "delete" && (
        <CvDeleteDialog cv={dialog.cv} onClose={() => setDialog(null)} onConfirm={() => { deleteCv(dialog.cv.id); setDialog(null); }} />
      )}
    </div>
  );
}
