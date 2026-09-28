import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";

const titles: Record<string, string> = {
  skills: "Skills",
  languages: "Languages",
  cvs: "CVs",
  profile: "Profile",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = titles[section];
  if (!title) notFound();

  return <AppShell title={title}><div /></AppShell>;
}
