import { notFound } from "next/navigation";
import { UserSkillsPreview, previewSkillGroups } from "@/components/user-skills-preview";

const titles: Record<string, string> = {
  skills: "Skills",
  languages: "Languages",
  cvs: "CVs",
  profile: "Profile",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!titles[section]) notFound();

  if (section === "skills") return <UserSkillsPreview skillGroups={previewSkillGroups} canEdit shared />;

  return null;
}
