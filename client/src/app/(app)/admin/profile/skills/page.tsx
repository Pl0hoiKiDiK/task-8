import { UserSkillsPreview, previewSkillGroups } from "@/components/user-skills-preview";

export default async function AdminProfileSkillsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  return <UserSkillsPreview skillGroups={preview === "filled" ? previewSkillGroups : []} canEdit />;
}
