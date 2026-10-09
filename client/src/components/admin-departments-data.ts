export type AdminDepartment = { id: string; name: string; inUse?: boolean };
export type DepartmentSort = "asc" | "desc" | null;

// The current admin pages use local preview data until authenticated catalog requests are wired up.
// These assignments match the employees shown in the local employees preview.
export const initialAdminDepartments: AdminDepartment[] = [
  { id: "react", name: "React", inUse: true },
  { id: "node", name: "Node" },
  { id: "python", name: "Python" },
  { id: "devops", name: "DevOps", inUse: true },
  { id: "global", name: "Global", inUse: true },
  { id: "quality-assurance", name: "Quality Assurance" },
  { id: "blockchain", name: "Blockchain", inUse: true },
  { id: "dot-net", name: ".NET", inUse: true },
  { id: "java", name: "Java", inUse: true },
  { id: "angular", name: "Angular" },
];

export function departmentNameExists(departments: AdminDepartment[], name: string, exceptId?: string) {
  const normalized = name.trim().toLocaleLowerCase();
  return Boolean(normalized) && departments.some((department) =>
    department.id !== exceptId && department.name.toLocaleLowerCase() === normalized,
  );
}

export function filterAndSortDepartments(departments: AdminDepartment[], search: string, sort: DepartmentSort) {
  const query = search.trim().toLocaleLowerCase();
  const result = departments.filter((department) => department.name.toLocaleLowerCase().includes(query));
  if (sort) result.sort((a, b) => sort === "asc"
    ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    : b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
  return result;
}
