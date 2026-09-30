import { notFound } from "next/navigation";

const titles: Record<string, string> = {
  skills: "Skills",
  languages: "Languages",
  cvs: "CVs",
  departments: "Departments",
  positions: "Positions",
  projects: "Projects",
};

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!titles[section]) notFound();

  return null;
}
