import { describe, expect, it } from "vitest";
import { departmentNameExists, filterAndSortDepartments, initialAdminDepartments } from "./admin-departments-data";

describe("admin department data", () => {
  it("rejects duplicate names without case or surrounding whitespace differences", () => {
    expect(departmentNameExists(initialAdminDepartments, "  react  ")).toBe(true);
    expect(departmentNameExists(initialAdminDepartments, "React", "react")).toBe(false);
    expect(departmentNameExists(initialAdminDepartments, "Flutter")).toBe(false);
  });

  it("searches all departments before sorting the results", () => {
    expect(filterAndSortDepartments(initialAdminDepartments, "a", "asc").map((item) => item.name))
      .toEqual(["Angular", "Blockchain", "Global", "Java", "Quality Assurance", "React"]);
    expect(filterAndSortDepartments(initialAdminDepartments, "a", "desc").map((item) => item.name)[0])
      .toBe("React");
  });
});
