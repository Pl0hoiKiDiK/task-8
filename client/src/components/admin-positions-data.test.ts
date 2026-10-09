import { describe, expect, it } from "vitest";
import { filterAndSortPositions, initialAdminPositions, positionNameExists } from "./admin-positions-data";

describe("admin position data", () => {
  it("rejects duplicate names without case or surrounding whitespace differences", () => {
    expect(positionNameExists(initialAdminPositions, "  SOFTWARE ENGINEER  ")).toBe(true);
    expect(positionNameExists(initialAdminPositions, "Software Engineer", "software-engineer")).toBe(false);
    expect(positionNameExists(initialAdminPositions, "Product Manager")).toBe(false);
  });

  it("searches the full catalog before sorting the results", () => {
    expect(filterAndSortPositions(initialAdminPositions, "engineer", "asc").map((item) => item.name))
      .toEqual(["DevOps Engineer", "Network Engineer", "QA Engineer", "Software Engineer"]);
    expect(filterAndSortPositions(initialAdminPositions, "ENGINEER", "desc").map((item) => item.name)[0])
      .toBe("Software Engineer");
  });
});
