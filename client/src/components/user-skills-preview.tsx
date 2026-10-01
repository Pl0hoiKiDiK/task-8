import { AdminProfileActions } from "@/components/admin-profile-actions";
import { ProfileProficiencyItem, type ProficiencyTone } from "@/components/profile-proficiency-item";

export type Skill = { name: string; tone: ProficiencyTone; level: number };
export type SkillGroup = { title: string; skills: Skill[] };

export const previewSkillGroups: SkillGroup[] = [
  {
    title: "Programming languages",
    skills: [
      { name: "TypeScript", tone: "yellow", level: 80 },
      { name: "JavaScript", tone: "red", level: 100 },
    ],
  },
  {
    title: "Frontend",
    skills: [
      { name: "React", tone: "red", level: 100 },
      { name: "CSS3", tone: "yellow", level: 80 },
      { name: "Storybook", tone: "gray", level: 20 },
      { name: "SCSS", tone: "yellow", level: 80 },
      { name: "React Query", tone: "yellow", level: 80 },
      { name: "Redux", tone: "yellow", level: 80 },
    ],
  },
  {
    title: "Backend",
    skills: [
      { name: "Keycloak", tone: "blue", level: 40 },
      { name: "Node.js", tone: "green", level: 60 },
      { name: "NestJS", tone: "green", level: 60 },
    ],
  },
  {
    title: "Source control systems",
    skills: [{ name: "Git", tone: "red", level: 100 }],
  },
];

export function UserSkillsPreview({ skillGroups, canEdit = false }: { skillGroups: SkillGroup[]; canEdit?: boolean }) {
  const hasSkills = skillGroups.some((group) => group.skills.length > 0);

  return (
    <div className={`user-skills-page${canEdit ? " user-skills-page--editable" : ""}`}>
      <div className={`user-skills-content${hasSkills ? "" : " admin-profile-content--empty"}`}>
        {hasSkills ? skillGroups.filter((group) => group.skills.length > 0).map(({ title, skills }) => (
          <section className="user-skills-group" key={title} aria-label={title}>
            <h1>{title}</h1>
            <div className="user-skills-grid">
              {skills.map((skill) => <ProfileProficiencyItem key={skill.name} {...skill} />)}
            </div>
          </section>
        )) : <h1 className="admin-profile-empty">No skills here</h1>}
        {canEdit && <AdminProfileActions item="skill" />}
      </div>
    </div>
  );
}
