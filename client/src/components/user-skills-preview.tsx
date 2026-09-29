import { AppShell } from "@/components/app-shell";
import { ProfileBreadcrumbs, ProfileTabs } from "@/components/profile-navigation";

type SkillTone = "yellow" | "red" | "green" | "gray" | "blue";
type Skill = { name: string; tone: SkillTone; level: number };

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

function SkillItem({ name, tone, level }: Skill) {
  return (
    <div className="user-skill">
      <span className={`user-skill-bar user-skill-bar--${tone}`} aria-hidden="true">
        <span style={{ width: `${level}%` }} />
      </span>
      <span>{name}</span>
    </div>
  );
}

export function UserSkillsPreview({ role = "user" }: { role?: "user" | "admin" }) {
  return (
    <AppShell
      title={<ProfileBreadcrumbs role={role} section="Skills" />}
      role={role}
      activeSection={role === "admin" ? "/admin/employees" : "/employees"}
      headerClassName="profile-header"
      showSettingsLink={role === "user"}
    >
      <div className="user-skills-page">
        <ProfileTabs role={role} section="Skills" />
        <div className="user-skills-content">
          {skillGroups.map(({ title, skills }) => (
            <section className="user-skills-group" key={title} aria-label={title}>
              <h1>{title}</h1>
              <div className="user-skills-grid">
                {skills.map((skill) => <SkillItem key={skill.name} {...skill} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
