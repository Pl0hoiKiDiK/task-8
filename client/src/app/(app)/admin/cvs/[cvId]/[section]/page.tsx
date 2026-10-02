import { notFound } from "next/navigation";
import { CvDetailsPage, type CvSection } from "@/components/cv-details-page";

const sections = ["skills", "projects", "preview"];

export default async function AdminCvSectionPage({ params }: { params: Promise<{ cvId: string; section: string }> }) {
  const { cvId, section } = await params;
  if (!sections.includes(section)) notFound();
  return <CvDetailsPage cvId={cvId} role="admin" section={section as CvSection} />;
}
