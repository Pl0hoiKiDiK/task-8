import { describe, expect, it } from "vitest";
import { availableOwnerSkills, initialCvSkills, masteryFromLevel, ownerSkillsFor } from "@/components/cv-skills-data";

describe("CV skill choices", () => {
  it("offers only skills of the selected CV owner that are not in that CV", () => {
    const choices = availableOwnerSkills(ownerSkillsFor("thorn_pear@icloud.com"), initialCvSkills["preview-cv-1"]);
    expect(choices.map((skill) => skill.name)).toEqual(["Three.js", "WebGL"]);
  });

  it("keeps available skills separate for a different owner", () => {
    const choices = availableOwnerSkills(ownerSkillsFor("alex.morgan@example.com"), []);
    expect(choices.map((skill) => skill.name)).toEqual(["TypeScript", "React", "CSS3", "Storybook", "Git"]);
    expect(ownerSkillsFor("unknown@example.com")).toEqual([]);
  });

  it("maps intermediate and out-of-range preview levels to a valid mastery", () => {
    expect(masteryFromLevel(50)).toBe("Competent");
    expect(masteryFromLevel(0)).toBe("Novice");
    expect(masteryFromLevel(120)).toBe("Expert");
    expect(masteryFromLevel(Number.NaN)).toBe("Novice");
  });
});
