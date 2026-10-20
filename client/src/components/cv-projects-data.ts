export type CatalogProject = {
  id: string;
  name: string;
  domain: string;
  description: string;
  environment: string[];
  startDate: string;
  endDate: string | null;
};

export type CvProjectEntry = {
  projectId: string;
  startDate: string;
  endDate: string;
  roles: string[];
  responsibilities: string[];
};

export type CvProjectFields = CvProjectEntry;
export type ProjectSortKey = "name" | "startDate" | "endDate";
export type SortDirection = "asc" | "desc";

export const projectCatalog: CatalogProject[] = [
  {
    id: "saas-media-platform",
    name: "SaaS Media Platform",
    domain: "IoT (Internet of Things)",
    description: "A digital music, podcast, and video service that gives you access to millions of songs and other content from creators all over the world. The user can connect and manage service providers such as Spotify, Apple Music, Tidal and SoundCloud in a few clicks and play content from them.",
    environment: ["TypeScript", "React", "Redux", "Redux Toolkit", "RTK Query", "Radix UI", "gRPC", "Keycloak"],
    startDate: "2023-08-21",
    endDate: null,
  },
  {
    id: "business-process-automation",
    name: "Business Process Automation",
    domain: "Automation",
    description: "A system for setting up business process automation. Includes work with webhooks, queries to third-party services and databases, mailing of letters, sms notifications and much more. The user can set up a scheme of interconnected processes and run them one after the other. Each type of work can be run synchronously or asynchronously. There is also support for error handling and re-execution attempts.",
    environment: ["HTML5", "CSS3", "TypeScript", "React", "Zustand", "Firebase"],
    startDate: "2023-01-20",
    endDate: "2023-06-19",
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    domain: "Data analytics",
    description: "A dashboard for exploring product metrics and sharing reports with a team.",
    environment: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    startDate: "2022-03-01",
    endDate: "2023-12-31",
  },
];

export const initialCvProjects: Record<string, CvProjectEntry[]> = {
  "preview-cv-1": [
    {
      projectId: "saas-media-platform",
      startDate: "2023-08-21",
      endDate: "",
      roles: ["Frontend Developer", "AI Developer"],
      responsibilities: ["Managed to write code in time"],
    },
    {
      projectId: "business-process-automation",
      startDate: "2023-01-20",
      endDate: "2023-06-19",
      roles: ["Frontend Developer", "AI Developer"],
      responsibilities: ["Did something great", "Did not break production"],
    },
  ],
  "preview-cv-2": [],
  "preview-cv-3": [],
};

export function validateCvProject(fields: CvProjectFields, catalog: CatalogProject[]) {
  const project = catalog.find((item) => item.id === fields.projectId);
  const errors: Partial<Record<"projectId" | "startDate" | "endDate" | "roles", string>> = {};

  if (!project) errors.projectId = "Project is required";
  if (!fields.startDate) errors.startDate = "Start date is required";
  else if (project && (fields.startDate < project.startDate || (project.endDate && fields.startDate > project.endDate))) {
    errors.startDate = "Start date must be within project duration";
  }

  if (fields.endDate && project && (fields.endDate < project.startDate || (project.endDate && fields.endDate > project.endDate))) {
    errors.endDate = "End date must be within project duration";
  } else if (fields.endDate && fields.startDate && fields.endDate < fields.startDate) {
    errors.endDate = "End date cannot be earlier than start date";
  }
  if (!fields.roles.length) errors.roles = "At least one role must be selected";
  return errors;
}

export function filterAndSortCvProjects(entries: CvProjectEntry[], catalog: CatalogProject[], search: string, key: ProjectSortKey, direction: SortDirection) {
  const query = search.trim().toLocaleLowerCase();
  const projectsById = new Map(catalog.map((project) => [project.id, project]));
  return entries.filter((entry) => {
    const project = projectsById.get(entry.projectId);
    return project && (!query || `${project.name} ${project.domain}`.toLocaleLowerCase().includes(query));
  }).sort((left, right) => {
    const a = key === "name" ? projectsById.get(left.projectId)?.name ?? "" : left[key];
    const b = key === "name" ? projectsById.get(right.projectId)?.name ?? "" : right[key];
    const result = a.localeCompare(b, undefined, { sensitivity: "base" });
    return direction === "asc" ? result : -result;
  });
}

export function formatProjectDate(value: string) {
  if (!value) return "Till now";
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}
