import { describe, expect, it } from "vitest";
import {
  filterAndSortCvProjects, initialCvProjects, projectCatalog, validateCvProject,
  type CvProjectFields,
} from "@/components/cv-projects-data";

const valid: CvProjectFields = {
  projectId: "business-process-automation",
  startDate: "2023-01-20",
  endDate: "2023-06-19",
  roles: ["Frontend Developer"],
  responsibilities: [],
};

describe("CV project validation", () => {
  it("requires a project, a start date and a role", () => {
    expect(validateCvProject({ ...valid, projectId: "", startDate: "", roles: [] }, projectCatalog)).toEqual({
      projectId: "Project is required",
      startDate: "Start date is required",
      roles: "At least one role must be selected",
    });
  });

  it("keeps participation dates within the catalog project's dates", () => {
    expect(validateCvProject({ ...valid, startDate: "2023-01-19" }, projectCatalog).startDate).toBe("Start date must be within project duration");
    expect(validateCvProject({ ...valid, startDate: "2023-06-20" }, projectCatalog).startDate).toBe("Start date must be within project duration");
    expect(validateCvProject({ ...valid, endDate: "2023-06-20" }, projectCatalog).endDate).toBe("End date must be within project duration");
    expect(validateCvProject({ ...valid, startDate: "2023-04-01", endDate: "2023-03-01" }, projectCatalog).endDate).toBe("End date cannot be earlier than start date");
    expect(validateCvProject({ ...valid, endDate: "" }, projectCatalog)).toEqual({});
  });
});

describe("CV project list", () => {
  it("searches both name and domain regardless of case", () => {
    const entries = initialCvProjects["preview-cv-1"];
    expect(filterAndSortCvProjects(entries, projectCatalog, "AUTOMATION", "name", "asc").map((item) => item.projectId)).toEqual(["business-process-automation"]);
    expect(filterAndSortCvProjects(entries, projectCatalog, "iot", "name", "asc").map((item) => item.projectId)).toEqual(["saas-media-platform"]);
  });

  it("sorts dates in both directions without mixing CVs", () => {
    const entries = initialCvProjects["preview-cv-1"];
    expect(filterAndSortCvProjects(entries, projectCatalog, "", "startDate", "asc").map((item) => item.projectId)).toEqual(["business-process-automation", "saas-media-platform"]);
    expect(filterAndSortCvProjects(entries, projectCatalog, "", "startDate", "desc").map((item) => item.projectId)).toEqual(["saas-media-platform", "business-process-automation"]);
    expect(filterAndSortCvProjects(initialCvProjects["preview-cv-2"], projectCatalog, "", "name", "asc")).toEqual([]);
  });
});
