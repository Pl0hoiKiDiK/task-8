"use client";

import { useRef, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { formatProjectDate } from "@/components/cv-projects-data";
import { calculateSkillExperience } from "@/components/cv-preview-data";
import { useCvPreviewData, type CvRecord } from "@/components/profile-cvs-data";
import { EXPORT_PDF, PROFILE_QUERY } from "@/lib/cv-api";

export function CvPreviewPage({ cv }: { cv: CvRecord }) {
  const client = useApolloClient();
  const sectionRef = useRef<HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const { cvProjects, cvSkills, cvLanguages, projectCatalog } = useCvPreviewData();
  const ownerResult = useQuery(PROFILE_QUERY, { variables: { userId: cv.ownerId ?? "" }, skip: !cv.ownerId });
  const languages = cvLanguages[cv.id] ?? [];
  const entries = cvProjects[cv.id] ?? [];
  const skills = cvSkills[cv.id] ?? [];
  const domains = [...new Set(entries.map((entry) => projectCatalog.find((project) => project.id === entry.projectId)?.domain).filter(Boolean))];
  const categories = [...new Set(skills.map((skill) => skill.category))];
  const groupedSkills = categories.flatMap((category) => skills.filter((skill) => skill.category === category));
  const ownerName = ownerResult.data?.profile.full_name || cv.employee;

  async function exportInBrowser(filename: string) {
    if (!sectionRef.current) throw new Error("CV preview is unavailable");
    const content = sectionRef.current.cloneNode(true) as HTMLElement;
    content.querySelectorAll("button, [role='alert']").forEach((element) => element.remove());
    content.style.setProperty("--text", "#2e2e2e");
    content.style.setProperty("--muted", "#626262");
    content.style.setProperty("--border", "#aeaeae");
    content.style.backgroundColor = "#ffffff";
    content.style.padding = "16px";
    const { default: html2pdf } = await import("html2pdf.js");
    await html2pdf().set({
      filename,
      margin: 8,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(content).save();
  }

  async function exportPdf() {
    if (!sectionRef.current || exporting) return;
    setExporting(true);
    setExportError("");
    const filename = `${cv.name.replace(/[^\p{L}\p{N}._-]+/gu, "_") || "CV"}.pdf`;
    try {
      const stylesheetLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
      const stylesheetTexts = await Promise.all(stylesheetLinks.map(async (link) => {
        const response = await fetch(link.href);
        if (!response.ok) throw new Error("Could not load PDF styles");
        return response.text();
      }));
      const inlineStyles = Array.from(document.querySelectorAll<HTMLStyleElement>("style")).map((style) => style.textContent ?? "");
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>${[...stylesheetTexts, ...inlineStyles].join("\n")}\nbody{padding:24px}button{display:none!important}</style></head><body>${sectionRef.current.outerHTML}</body></html>`;
      const { data } = await client.mutate<{ exportPdf: string }>({ mutation: EXPORT_PDF, variables: { pdf: { html } } });
      if (!data?.exportPdf) throw new Error("Empty PDF");
      const bytes = Uint8Array.from(atob(data.exportPdf), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      try {
        await exportInBrowser(filename);
      } catch {
        setExportError("Failed to export PDF. Please try again.");
      }
    } finally { setExporting(false); }
  }

  return <section ref={sectionRef} aria-label="CV preview" className="mx-auto w-full max-w-[920px] pb-12 pt-6 text-[var(--text)] print:max-w-none print:pb-0 print:pt-0">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[34px] leading-tight font-normal">{ownerName}</h1>
        <p className="mt-1 text-base uppercase">{cv.position || cv.name.split(/\s+with\s+/i)[0]}</p>
      </div>
      <button type="button" onClick={() => { void exportPdf(); }} disabled={exporting}
        className="h-10 min-w-40 rounded-full border border-[var(--red)] px-5 text-sm font-medium uppercase text-[var(--red)] hover:bg-[var(--red)] hover:text-white active:opacity-80 print:hidden">
        {exporting ? "Exporting..." : "Export PDF"}
      </button>
    </div>
    {exportError && <p role="alert" className="mb-4 text-[var(--red)] print:hidden">{exportError}</p>}

    <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-0">
      <div className="space-y-5 text-base sm:pr-6">
        <div><h2 className="font-semibold">Education</h2><p className="mt-2">{cv.education || "—"}</p></div>
        <div><h2 className="font-semibold">Language proficiency</h2><p className="mt-2">{languages.map((language) => `${language.name} ${language.proficiency}`).join(", ") || "—"}</p></div>
        <div><h2 className="font-semibold">Domains</h2><p className="mt-2">{domains.join(", ") || "—"}</p></div>
      </div>
      <div className="border-l border-[var(--red)] pl-6 text-base leading-6">
        <h2 className="font-semibold">{cv.name}</h2>
        <p className="mt-2 whitespace-pre-wrap">{cv.description}</p>
        {categories.map((category) => <div key={category} className="mt-4">
          <h3 className="font-semibold">{category}</h3>
          <p className="mt-2">{skills.filter((skill) => skill.category === category).map((skill) => skill.name).join(", ")}.</p>
        </div>)}
      </div>
    </div>

    <section aria-labelledby="preview-projects-title" className="mt-10">
      <h2 id="preview-projects-title" className="mb-6 text-[34px] font-normal">Projects</h2>
      {entries.length ? entries.map((entry) => {
        const project = projectCatalog.find((item) => item.id === entry.projectId);
        if (!project) return null;
        return <article key={entry.projectId} className="mb-8 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-0 print:break-inside-avoid">
          <div className="sm:pr-6">
            <h3 className="font-semibold uppercase text-[var(--red)]">{project.name}</h3>
            <p className="mt-3 whitespace-pre-wrap leading-6">{project.description}</p>
          </div>
          <div className="space-y-4 border-l border-[var(--red)] pl-6 leading-6">
            {entry.roles.length > 0 && <div><h4 className="font-semibold">Project roles</h4><p className="mt-2">{entry.roles.join(", ")}</p></div>}
            <div><h4 className="font-semibold">Period</h4><p className="mt-2">{formatProjectDate(entry.startDate)} – {entry.endDate ? formatProjectDate(entry.endDate) : "Present"}</p></div>
            {entry.responsibilities.length > 0 && <div><h4 className="font-semibold">Responsibilities</h4>
              <ul className="mt-2 list-disc pl-5">{entry.responsibilities.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
            </div>}
            <div><h4 className="font-semibold">Environment</h4><p className="mt-2">{project.environment.join(", ")}.</p></div>
          </div>
        </article>;
      }) : <p className="text-[var(--muted)]">No projects added yet</p>}
    </section>

    <section aria-labelledby="preview-skills-title" className="mt-10">
      <h2 id="preview-skills-title" className="mb-5 text-[34px] font-normal">Professional skills</h2>
      {skills.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead><tr className="border-b border-[var(--red)] uppercase"><th className="px-4 py-3 font-medium">Skills Category</th><th className="px-4 py-3 font-medium">Skill</th><th className="px-4 py-3 font-medium">Experience in Years</th><th className="px-4 py-3 font-medium">Last Used</th></tr></thead>
        <tbody>{groupedSkills.map((skill, index) => {
          const experience = calculateSkillExperience(skill, entries, projectCatalog);
          return <tr key={`${skill.category}-${skill.name}`} className="border-b border-[var(--border)] align-top">
            {groupedSkills.findIndex((item) => item.category === skill.category) === index && <th scope="row" rowSpan={groupedSkills.filter((item) => item.category === skill.category).length} className="px-4 py-4 font-medium text-[var(--red)]">{skill.category}</th>}
            <td className="px-4 py-4">{skill.name}</td>
            <td className="px-4 py-4">{experience.years === null ? "—" : `${experience.years} years`}</td>
            <td className="px-4 py-4">{experience.lastUsed ?? "—"}</td>
          </tr>;
        })}</tbody>
      </table></div> : <p className="text-[var(--muted)]">No skills added yet</p>}
    </section>
  </section>;
}
