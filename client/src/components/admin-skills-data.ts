export type AdminSkill = { id: string; name: string; category: string };
export type SkillCategory = { name: string; type: string };

export const skillCategories: SkillCategory[] = [
  { name: "Programming Languages", type: "Programming" },
  { name: "Frontend", type: "Frontend" },
  { name: "Backend Technologies", type: "Backend" },
  { name: "Cloud", type: "Backend" },
  { name: "Databases", type: "Backend" },
  { name: "Source Control Systems", type: "Tools" },
];

export const initialAdminSkills: AdminSkill[] = [
  { id: "websockets", name: "WebSockets", category: "Backend Technologies" },
  { id: "keycloak", name: "Keycloak", category: "Backend Technologies" },
  { id: "firebase", name: "Firebase", category: "Cloud" },
  { id: "postgresql", name: "PostgreSQL", category: "Databases" },
  { id: "redis", name: "Redis", category: "Databases" },
  { id: "nestjs", name: "NestJS", category: "Backend Technologies" },
  { id: "nodejs", name: "Node.js", category: "Backend Technologies" },
  { id: "mongodb", name: "MongoDB", category: "Databases" },
  { id: "grpc", name: "gRPC", category: "Backend Technologies" },
  { id: "graphql", name: "GraphQL", category: "Backend Technologies" },
];

export function skillType(category: string): string {
  return skillCategories.find((item) => item.name === category)?.type ?? "";
}

export function skillNameExists(skills: AdminSkill[], name: string, exceptId?: string): boolean {
  return skills.some((skill) => skill.id !== exceptId && skill.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase());
}

export function filterAndSortSkills(skills: AdminSkill[], search: string, direction: "asc" | "desc" | null): AdminSkill[] {
  const query = search.trim().toLocaleLowerCase();
  const result = skills.filter((skill) => skill.name.toLocaleLowerCase().includes(query));
  if (direction) result.sort((a, b) => direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  return result;
}
