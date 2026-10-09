import { UserSkillsPreview, previewSkillGroups } from "@/components/user-skills-preview";

export default function ProfileSkillsPage() {
  return <UserSkillsPreview skillGroups={previewSkillGroups} canEdit shared />;
}
