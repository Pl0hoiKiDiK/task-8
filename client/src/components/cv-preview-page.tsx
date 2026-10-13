"use client";

import { formatProjectDate, projectCatalog } from "@/components/cv-projects-data";
import { previewEmployeeEmail, useCvPreviewData, type CvRecord } from "@/components/profile-cvs-data";
import { useLanguagePreviewData } from "@/components/profile-languages-data";

export function CvPreviewPage({ cv }: { cv: CvRecord }) {
  const { cvProjects, cvSkills } = useCvPreviewData();
  const { languages } = useLanguagePreviewData();
  const entries = cvProjects[cv.id] ?? [];
  const skills = cvSkills[cv.id] ?? [];
  const domains = [...new Set(entries.map((entry) => projectCatalog.find((project) => project.id === entry.projectId)?.domain).filter(Boolean))];
  const categories = [...new Set(skills.map((skill) => skill.category))];
  const ownerName = cv.employee === previewEmployeeEmail ? "Rostislav Harlanov" :
    cv.employee.split("@")[0].split(/[._-]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

  return <section aria-label="CV preview" className="mx-auto w-full max-w-[920px] pb-12 pt-6 text-[var(--text)] print:max-w-none print:pb-0 print:pt-0">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[34px] leading-tight font-normal">{ownerName}</h1>
        <p className="mt-1 text-base uppercase">{cv.name.split(/\s+with\s+/i)[0]}</p>
      </div>
      <button type="button" onClick={() => window.print()}
        className="h-10 min-w-40 rounded-full border border-[var(--red)] px-5 text-sm font-medium uppercase text-[var(--red)] hover:bg-[var(--red)] hover:text-white active:opacity-80 print:hidden">
        Export PDF
      </button>
    </div>

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
            <div><h4 className="font-semibold">Project roles</h4><p className="mt-2">{entry.roles.join(", ")}</p></div>
            <div><h4 className="font-semibold">Period</h4><p className="mt-2">{formatProjectDate(entry.startDate)} – {formatProjectDate(entry.endDate)}</p></div>
            <div><h4 className="font-semibold">Responsibilities</h4>
              {entry.responsibilities.length ? <ul className="mt-2 list-disc pl-5">{entry.responsibilities.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="mt-2">—</p>}
            </div>
            <div><h4 className="font-semibold">Environment</h4><p className="mt-2">{project.environment.join(", ")}.</p></div>
          </div>
        </article>;
      }) : <p className="text-[var(--muted)]">No projects added yet</p>}
    </section>

    <section aria-labelledby="preview-skills-title" className="mt-10">
      <h2 id="preview-skills-title" className="mb-5 text-[34px] font-normal">Professional skills</h2>
      {categories.length ? <table className="w-full border-collapse text-left text-sm">
        <thead><tr className="border-b border-[var(--red)] uppercase"><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Skills</th><th className="px-4 py-3 font-medium">Mastery</th></tr></thead>
        <tbody>{categories.map((category) => <tr key={category} className="border-b border-[var(--border)] align-top">
          <th scope="row" className="px-4 py-4 font-medium text-[var(--red)]">{category}</th>
          <td className="px-4 py-4">{skills.filter((skill) => skill.category === category).map((skill) => skill.name).join(", ")}</td>
          <td className="px-4 py-4">{skills.filter((skill) => skill.category === category).map((skill) => skill.mastery).join(", ")}</td>
        </tr>)}</tbody>
      </table> : <p className="text-[var(--muted)]">No skills added yet</p>}
    </section>
  </section>;
}
