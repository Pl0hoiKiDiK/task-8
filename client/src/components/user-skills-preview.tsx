import { AdminProfileActions } from "@/components/admin-profile-actions";
import { ProfileTabs } from "@/components/profile-navigation";
import { ProfileProficiencyItem, type ProficiencyTone } from "@/components/profile-proficiency-item";

type Skill = { name: string; tone: ProficiencyTone; level: number };

const skillGroups: { title: string; skills: Skill[] }[] = [
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

export function UserSkillsPreview({ role = "user", showExample = false }: { role?: "user" | "admin"; showExample?: boolean }) {
  const showSkills = role === "user" || showExample;

  return (
    <>
      <div className={`user-skills-page${role === "admin" ? " user-skills-page--admin" : ""}`}>
        <ProfileTabs role={role} section="Skills" />
        <div className={`user-skills-content${role === "admin" && !showSkills ? " admin-profile-content--empty" : ""}`}>
          {showSkills ? skillGroups.map(({ title, skills }) => (
            <section className="user-skills-group" key={title} aria-label={title}>
              <h1>{title}</h1>
              <div className="user-skills-grid">
                {skills.map((skill) => <ProfileProficiencyItem key={skill.name} {...skill} />)}
              </div>
            </section>
          )) : <h1 className="admin-profile-empty">No skills here</h1>}
          {role === "admin" && <AdminProfileActions item="skill" />}
        </div>
      </div>
    </>
  );
}
