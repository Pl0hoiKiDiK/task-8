export type AdminPosition = { id: string; name: string; inUse?: boolean };
export type PositionSort = "asc" | "desc" | null;

// Local catalog preview until authenticated position requests are connected.
// In-use flags reflect the assignments in the local employees preview.
export const initialAdminPositions: AdminPosition[] = [
  { id: "software-engineer", name: "Software Engineer", inUse: true },
  { id: "systems-analyst", name: "Systems Analyst" },
  { id: "network-engineer", name: "Network Engineer", inUse: true },
  { id: "database-administrator", name: "Database Administrator" },
  { id: "ux-designer", name: "UX Designer" },
  { id: "support-specialist", name: "Support Specialist" },
  { id: "data-analyst", name: "Data Analyst", inUse: true },
  { id: "data-architect", name: "Data Architect" },
  { id: "devops-engineer", name: "DevOps Engineer", inUse: true },
  { id: "qa-engineer", name: "QA Engineer" },
];

export function positionNameExists(positions: AdminPosition[], name: string, exceptId?: string) {
  const normalized = name.trim().toLocaleLowerCase();
  return Boolean(normalized) && positions.some((position) =>
    position.id !== exceptId && position.name.toLocaleLowerCase() === normalized,
  );
}

export function filterAndSortPositions(positions: AdminPosition[], search: string, sort: PositionSort) {
  const query = search.trim().toLocaleLowerCase();
  const result = positions.filter((position) => position.name.toLocaleLowerCase().includes(query));
  if (sort) result.sort((a, b) => sort === "asc"
    ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    : b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
  return result;
}
