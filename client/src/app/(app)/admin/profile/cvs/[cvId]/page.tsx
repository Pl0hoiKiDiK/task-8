"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCvPreviewData } from "@/components/profile-cvs-data";

export default function AdminProfileCvDetailsPage() {
  const { cvId } = useParams<{ cvId: string }>();
  const { cvs } = useCvPreviewData();
  const cv = cvs.find((item) => item.id === cvId);

  return (
    <section className="profile-cv-detail" aria-label="CV details">
      <Link href="/admin/profile/cvs" className="profile-cv-detail-back">← Back to CVs</Link>
      {cv ? (
        <>
          <h1>{cv.name}</h1>
          <dl>
            <div><dt>Education</dt><dd>{cv.education}</dd></div>
            <div><dt>Employee</dt><dd>{cv.employee}</dd></div>
          </dl>
          <h2>Description</h2>
          <p>{cv.description}</p>
        </>
      ) : <p role="status">CV not found</p>}
    </section>
  );
}
