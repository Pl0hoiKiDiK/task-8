import { describe, expect, it } from "vitest";
import { filterAndSortCvs } from "@/lib/cv-list";
import type { CvRecord } from "@/components/profile-cvs-data";

const cvs: CvRecord[] = [
  { id: "1", name: "Zebra", education: "React", employee: "one@example.com", description: "First" },
  { id: "2", name: "alpha", education: "Node", employee: "one@example.com", description: "Second" },
  { id: "3", name: "Beta", education: "React", employee: "one@example.com", description: "Third" },
];

describe("filterAndSortCvs", () => {
  it("filters by name without case sensitivity", () => {
    expect(filterAndSortCvs(cvs, " ALP ", "asc").map((cv) => cv.id)).toEqual(["2"]);
  });

  it("does not search education or description", () => {
    expect(filterAndSortCvs(cvs, "React", "asc")).toEqual([]);
  });

  it("searches employee email only for the admin view", () => {
    expect(filterAndSortCvs(cvs, "ONE@EXAMPLE", "asc")).toEqual([]);
    expect(filterAndSortCvs(cvs, "ONE@EXAMPLE", "asc", true).map((cv) => cv.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by name in both directions without changing the source list", () => {
    expect(filterAndSortCvs(cvs, "", "asc").map((cv) => cv.id)).toEqual(["2", "3", "1"]);
    expect(filterAndSortCvs(cvs, "", "desc").map((cv) => cv.id)).toEqual(["1", "3", "2"]);
    expect(cvs.map((cv) => cv.id)).toEqual(["1", "2", "3"]);
  });
});
