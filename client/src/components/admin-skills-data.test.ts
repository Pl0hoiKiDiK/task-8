import { describe, expect, it } from "vitest";
import { filterAndSortSkills, skillNameExists, skillType, type AdminSkill } from "./admin-skills-data";

const skills: AdminSkill[] = [
  { id: "1", name: "Redis", category: "Databases" },
  { id: "2", name: "GraphQL", category: "Backend Technologies" },
  { id: "3", name: "TypeScript", category: "Programming Languages" },
];

describe("admin skills catalog", () => {
  it("filters names case-insensitively and sorts in either direction", () => {
    expect(filterAndSortSkills(skills, "RED", null).map((skill) => skill.name)).toEqual(["Redis"]);
    expect(filterAndSortSkills(skills, "", "asc").map((skill) => skill.name)).toEqual(["GraphQL", "Redis", "TypeScript"]);
    expect(filterAndSortSkills(skills, "", "desc").map((skill) => skill.name)).toEqual(["TypeScript", "Redis", "GraphQL"]);
  });

  it("rejects duplicate names on create and edit while deriving type from category", () => {
    expect(skillNameExists(skills, "  GRAPHQL ")).toBe(true);
    expect(skillNameExists(skills, "GraphQL", "2")).toBe(false);
    expect(skillType("Databases")).toBe("Backend");
    expect(skillType("Programming Languages")).toBe("Programming");
  });
});
