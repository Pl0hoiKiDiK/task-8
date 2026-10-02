import { notFound } from "next/navigation";
import { AdminSkillsPage } from "@/components/admin-skills-page";

const titles: Record<string, string> = {
  skills: "Skills",
  languages: "Languages",
  cvs: "CVs",
  departments: "Departments",
  positions: "Positions",
  projects: "Projects",
  profile: "Profile",
};

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!titles[section]) notFound();

  if (section === "skills") return <AdminSkillsPage />;
  return null;
}
