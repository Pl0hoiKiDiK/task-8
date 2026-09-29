import { UserSkillsPreview } from "@/components/user-skills-preview";

export default async function AdminProfileSkillsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  return <UserSkillsPreview role="admin" showExample={preview === "filled"} />;
}
