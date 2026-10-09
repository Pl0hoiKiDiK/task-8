import type { ProficiencyTone } from "@/components/profile-proficiency-item";

export type SkillMastery = "Novice" | "Advanced" | "Competent" | "Proficient" | "Expert";
export type CvSkill = { name: string; category: string; mastery: SkillMastery };
export type OwnerSkill = CvSkill;

export const masteryOptions: SkillMastery[] = ["Novice", "Advanced", "Competent", "Proficient", "Expert"];

export const masteryDisplay: Record<SkillMastery, { level: number; tone: ProficiencyTone }> = {
  Novice: { level: 20, tone: "gray" },
  Advanced: { level: 40, tone: "blue" },
  Competent: { level: 60, tone: "green" },
  Proficient: { level: 80, tone: "yellow" },
  Expert: { level: 100, tone: "red" },
};

export function masteryFromLevel(level: number): SkillMastery {
  if (!Number.isFinite(level)) return "Novice";
  const index = Math.min(masteryOptions.length - 1, Math.max(0, Math.round(level / 20) - 1));
  return masteryOptions[index];
}

export const previewCvSkills: OwnerSkill[] = [
  { name: "TypeScript", category: "Programming languages", mastery: "Proficient" },
  { name: "JavaScript", category: "Programming languages", mastery: "Expert" },
  { name: "React", category: "Frontend", mastery: "Expert" },
  { name: "CSS3", category: "Frontend", mastery: "Proficient" },
  { name: "Storybook", category: "Frontend", mastery: "Novice" },
  { name: "SCSS", category: "Frontend", mastery: "Proficient" },
  { name: "React Query", category: "Frontend", mastery: "Proficient" },
  { name: "Redux", category: "Frontend", mastery: "Proficient" },
  { name: "Keycloak", category: "Backend", mastery: "Advanced" },
  { name: "Node.js", category: "Backend", mastery: "Competent" },
  { name: "NestJS", category: "Backend", mastery: "Competent" },
  { name: "Git", category: "Source control systems", mastery: "Expert" },
];

export const previewOwnerSkills: OwnerSkill[] = [
  ...previewCvSkills,
  { name: "Three.js", category: "Frontend", mastery: "Competent" },
  { name: "WebGL", category: "Frontend", mastery: "Advanced" },
];

export function ownerSkillsFor(email: string): OwnerSkill[] {
  if (email === "thorn_pear@icloud.com") return previewOwnerSkills;
  if (email === "alex.morgan@example.com") return previewOwnerSkills.filter((skill) => ["TypeScript", "React", "CSS3", "Storybook", "Git"].includes(skill.name));
  return [];
}

export const initialCvSkills: Record<string, CvSkill[]> = {
  "preview-cv-1": previewCvSkills,
  "preview-cv-2": [],
  "preview-cv-3": ownerSkillsFor("alex.morgan@example.com").filter((skill) => skill.name !== "Storybook"),
};

export function availableOwnerSkills(ownerSkills: OwnerSkill[], cvSkills: CvSkill[]) {
  const used = new Set(cvSkills.map((skill) => skill.name));
  return ownerSkills.filter((skill) => !used.has(skill.name));
}
