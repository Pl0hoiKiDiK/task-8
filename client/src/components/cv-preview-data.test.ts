import { describe, expect, it } from "vitest";
import { calculateSkillExperience } from "./cv-preview-data";
import type { CvSkill } from "./cv-skills-data";
import type { CatalogProject, CvProjectEntry } from "./cv-projects-data";

const react: CvSkill = { name: "React", category: "Frontend", mastery: "Advanced" };
const projects: CatalogProject[] = [
  { id: "old", name: "Old", domain: "Web", description: "", environment: ["React"], startDate: "2021-01-01", endDate: "2023-12-31" },
  { id: "new", name: "New", domain: "Web", description: "", environment: [" react "], startDate: "2023-01-01", endDate: "2025-06-30" },
  { id: "active", name: "Active", domain: "Web", description: "", environment: ["React"], startDate: "2025-01-01", endDate: null },
];
const entry = (projectId: string, startDate: string, endDate: string): CvProjectEntry => ({ projectId, startDate, endDate, roles: [], responsibilities: [] });

describe("CV preview skill experience", () => {
  it("uses only projects in the current CV and their participation dates", () => {
    const entries = [entry("old", "2022-03-01", "2023-12-31"), entry("new", "2023-06-01", "2025-06-30")];
    expect(calculateSkillExperience(react, entries, projects, new Date(2026, 9, 20))).toEqual({ years: 4, lastUsed: 2025 });
  });

  it("uses the current year when a matching project is active", () => {
    expect(calculateSkillExperience(react, [entry("active", "2025-01-01", "")], projects, new Date(2026, 9, 20))).toEqual({ years: 1, lastUsed: 2026 });
  });

  it("leaves values empty when the skill is absent from project environments", () => {
    expect(calculateSkillExperience({ ...react, name: "Angular" }, [entry("old", "2022-03-01", "2023-12-31")], projects)).toEqual({ years: null, lastUsed: null });
  });
});
