import { notFound } from "next/navigation";

const titles: Record<string, string> = {
  skills: "Skills",
  languages: "Languages",
  cvs: "CVs",
  profile: "Profile",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!titles[section]) notFound();

  return null;
}
