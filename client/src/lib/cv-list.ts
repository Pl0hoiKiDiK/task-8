import type { CvRecord } from "@/components/profile-cvs-data";

export type CvSortDirection = "asc" | "desc";

const nameCollator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

export function filterAndSortCvs(cvs: CvRecord[], search: string, direction: CvSortDirection) {
  const query = search.trim().toLocaleLowerCase();
  return cvs
    .filter((cv) => cv.name.toLocaleLowerCase().includes(query))
    .sort((left, right) => {
      const comparison = nameCollator.compare(left.name, right.name);
      return direction === "asc" ? comparison : -comparison;
    });
}
