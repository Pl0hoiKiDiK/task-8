import type { CvSkill } from "@/components/cv-skills-data";
import type { CatalogProject, CvProjectEntry } from "@/components/cv-projects-data";

export type SkillExperience = { years: number | null; lastUsed: number | null };

function fullYearsSince(start: string, today: Date): number {
  const [year, month, day] = start.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return 0;
  const years = today.getFullYear() - year;
  const anniversaryPassed = today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  return Math.max(0, years - (anniversaryPassed ? 0 : 1));
}

export function calculateSkillExperience(
  skill: CvSkill,
  entries: CvProjectEntry[],
  projects: CatalogProject[],
  today = new Date(),
): SkillExperience {
  const normalizedName = skill.name.trim().toLocaleLowerCase();
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const matching = entries.filter((entry) => projectsById.get(entry.projectId)?.environment.some(
    (item) => item.trim().toLocaleLowerCase() === normalizedName,
  ));
  if (!matching.length) return { years: null, lastUsed: null };

  const earliestStart = matching.map((entry) => entry.startDate).sort()[0];
  const lastUsed = matching.some((entry) => !entry.endDate)
    ? today.getFullYear()
    : Math.max(...matching.map((entry) => Number(entry.endDate.slice(0, 4))));
  return { years: fullYearsSince(earliestStart, today), lastUsed };
}
