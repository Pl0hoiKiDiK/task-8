"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { previewEmployeeEmail, useCvPreviewData, type CvFields, type CvRecord } from "@/components/profile-cvs-data";

export type CvSection = "details" | "skills" | "projects" | "preview";

const sections: { label: string; value: CvSection }[] = [
  { label: "Details", value: "details" },
  { label: "Skills", value: "skills" },
  { label: "Projects", value: "projects" },
  { label: "Preview", value: "preview" },
];

function basePath(role: "admin" | "employee", cvId: string) {
  return `${role === "admin" ? "/admin" : ""}/cvs/${encodeURIComponent(cvId)}`;
}

export function CvDetailsBreadcrumbs({ cvId, role, section }: { cvId: string; role: "admin" | "employee"; section: CvSection }) {
  const { cvs } = useCvPreviewData();
  const cv = cvs.find((item) => item.id === cvId && (role === "admin" || item.employee === previewEmployeeEmail));
  return (
    <nav className="cv-details-breadcrumbs" aria-label="Breadcrumb">
      <Link href={role === "admin" ? "/admin/cvs" : "/cvs"}>CVs</Link>
      <span aria-hidden="true">›</span>
      <span className="cv-details-breadcrumb-name">{cv?.name ?? "CV"}</span>
      <span aria-hidden="true">›</span>
      <span aria-current="page">{sections.find((item) => item.value === section)?.label}</span>
    </nav>
  );
}

function validate(fields: CvFields) {
  return {
    name: !fields.name.trim() ? "Name is required" : fields.name.length > 255 ? "Name must be 255 characters or fewer" : "",
    education: !fields.education.trim() ? "Education is required" : fields.education.length > 255 ? "Education must be 255 characters or fewer" : "",
    description: !fields.description.trim() ? "Description is required" : "",
  };
}

function CvDetailsForm({ cv }: { cv: CvRecord }) {
  const { updateCv } = useCvPreviewData();
  const initialFields = { name: cv.name, education: cv.education, description: cv.description };
  const [saved, setSaved] = useState<CvFields>(initialFields);
  const [fields, setFields] = useState<CvFields>(initialFields);
  const [touched, setTouched] = useState<Record<keyof CvFields, boolean>>({ name: false, education: false, description: false });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const errors = validate(fields);
  const dirty = (Object.keys(fields) as (keyof CvFields)[]).some((key) => fields[key] !== saved[key]);
  const valid = !errors.name && !errors.education && !errors.description;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || !valid || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const next = { name: fields.name.trim(), education: fields.education.trim(), description: fields.description.trim() };
      await updateCv(cv.id, next);
      setFields(next);
      setSaved(next);
    } catch {
      setSaveError("Failed to update CV. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof CvFields, label: string) {
    const error = touched[key] && errors[key];
    const id = `cv-details-${key}`;
    const shared = {
      id,
      name: key,
      value: fields[key],
      "aria-invalid": Boolean(error) as boolean,
      "aria-describedby": error ? `${id}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFields((current) => ({ ...current, [key]: event.target.value }));
        setSaveError("");
      },
      onBlur: () => setTouched((current) => ({ ...current, [key]: true })),
    };
    return (
      <div className="cv-details-field" key={key}>
        <label htmlFor={id}>{label}</label>
        {key === "description" ? <textarea {...shared} /> : <input {...shared} type="text" maxLength={255} />}
        {error && <span className="cv-details-field-error" id={`${id}-error`}>{error}</span>}
      </div>
    );
  }

  return (
    <form className="cv-details-form" onSubmit={save} noValidate>
      {field("name", "Name")}
      {field("education", "Education")}
      {field("description", "Description")}
      {saveError && <p className="cv-details-save-error" role="alert">{saveError}</p>}
      <button className="cv-details-update" type="submit" disabled={!dirty || !valid || saving}>{saving ? "Updating..." : "Update"}</button>
    </form>
  );
}

export function CvDetailsPage({ cvId, role, section = "details" }: { cvId: string; role: "admin" | "employee"; section?: CvSection }) {
  const router = useRouter();
  const { cvs } = useCvPreviewData();
  const cv = cvs.find((item) => item.id === cvId && (role === "admin" || item.employee === previewEmployeeEmail));
  const base = basePath(role, cvId);

  if (!cv) {
    return (
      <div className="cv-details-unavailable" role="alert">
        <p>Failed to load CV details</p>
        <button type="button" onClick={() => router.refresh()}>Retry</button>
        <Link href={role === "admin" ? "/admin/cvs" : "/cvs"}>Back to CVs</Link>
      </div>
    );
  }

  return (
    <section className="cv-details-page" aria-label="CV details">
      <nav className="cv-details-tabs" aria-label="CV sections">
        {sections.map((item) => (
          <Link
            key={item.value}
            href={item.value === "details" ? base : `${base}/${item.value}`}
            className={`cv-details-tab${section === item.value ? " cv-details-tab--active" : ""}`}
            aria-current={section === item.value ? "page" : undefined}
          >{item.label}</Link>
        ))}
      </nav>
      {section === "details" ? <CvDetailsForm key={cv.id} cv={cv} /> :
        <p className="cv-details-section-placeholder">{sections.find((item) => item.value === section)?.label} content will be added here.</p>}
    </section>
  );
}
