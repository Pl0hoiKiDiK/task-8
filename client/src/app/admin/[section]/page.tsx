import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";

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
  const title = titles[section];
  if (!title) notFound();

  return <AppShell title={title} role="admin"><div /></AppShell>;
}
