import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client";
import type { CatalogProject, CvProjectEntry } from "@/components/cv-projects-data";
import type { CvSkill, SkillMastery } from "@/components/cv-skills-data";
import type { CvRecord } from "@/components/profile-cvs-data";
import type { LanguageProficiency, ProfileLanguage } from "@/components/profile-languages-data";
import { loadAllCatalogItems, type CatalogPage } from "@/lib/catalog-api";

export type ApiSkillMastery = { name: string; categoryId: string | null; mastery: SkillMastery };
export type ApiProfile = {
  id: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar: string | null;
  email: string | null;
  is_verified: boolean | null;
  skills: ApiSkillMastery[];
  languages: ProfileLanguage[];
};
export type ApiCvProject = {
  project: ApiProject;
  start_date: string;
  end_date: string | null;
  roles: string[];
  responsibilities: string[];
};
export type ApiProject = {
  id: string;
  name: string;
  domain: string;
  description: string;
  environment: string[];
  start_date: string;
  end_date: string | null;
};
export type ApiCv = {
  id: string;
  name: string;
  education: string | null;
  description: string;
  user: { id: string; email: string; position: { name: string } | null } | null;
  skills: ApiSkillMastery[];
  languages: ProfileLanguage[];
  projects: ApiCvProject[] | null;
};

type PageVariables = { params: { page: number; limit: number } };
export const CVS_QUERY: TypedDocumentNode<{ cvs: CatalogPage<ApiCv> }, PageVariables> = gql`
  query AllCvs($params: SearchPaginationInput) {
    cvs(params: $params) {
      items {
        id name education description
        user { id email position { name } }
        skills { name categoryId mastery }
        languages { name proficiency }
      }
      total_pages
    }
  }
`;
export const CV_QUERY: TypedDocumentNode<{ cv: ApiCv }, { cvId: string }> = gql`
  query CvById($cvId: ID!) {
    cv(cvId: $cvId) {
      id name education description
      user { id email position { name } }
      skills { name categoryId mastery }
      languages { name proficiency }
      projects {
        project { id name domain description environment start_date end_date }
        start_date end_date roles responsibilities
      }
    }
  }
`;
export const CREATE_CV = gql`mutation CreateCv($cv: CreateCvInput!) { createCv(cv: $cv) { id } }`;
export const UPDATE_CV = gql`mutation UpdateCv($cv: UpdateCvInput!) { updateCv(cv: $cv) { id } }`;
export const DELETE_CV = gql`mutation DeleteCv($cv: DeleteCvInput!) { deleteCv(cv: $cv) { affected } }`;

export const PROFILE_QUERY: TypedDocumentNode<{ profile: ApiProfile }, { userId: string }> = gql`
  query ProfileByUserId($userId: ID!) {
    profile(userId: $userId) {
      id created_at first_name last_name full_name avatar email is_verified
      skills { name categoryId mastery }
      languages { name proficiency }
    }
  }
`;
export const ME_QUERY: TypedDocumentNode<{ me: ApiProfile }> = gql`
  query CurrentProfile {
    me {
      id created_at first_name last_name full_name avatar email is_verified
      skills { name categoryId mastery }
      languages { name proficiency }
    }
  }
`;
export const DELETE_AVATAR = gql`mutation DeleteAvatar($avatar: DeleteAvatarInput!) { deleteAvatar(avatar: $avatar) }`;
export const ADD_PROFILE_SKILL = gql`mutation AddProfileSkill($skill: AddProfileSkillInput!) { addProfileSkill(skill: $skill) { id } }`;
export const UPDATE_PROFILE_SKILL = gql`mutation UpdateProfileSkill($skill: UpdateProfileSkillInput!) { updateProfileSkill(skill: $skill) { id } }`;
export const DELETE_PROFILE_SKILL = gql`mutation DeleteProfileSkill($skill: DeleteProfileSkillInput!) { deleteProfileSkill(skill: $skill) { id } }`;
export const ADD_PROFILE_LANGUAGE = gql`mutation AddProfileLanguage($language: AddProfileLanguageInput!) { addProfileLanguage(language: $language) { id } }`;
export const UPDATE_PROFILE_LANGUAGE = gql`mutation UpdateProfileLanguage($language: UpdateProfileLanguageInput!) { updateProfileLanguage(language: $language) { id } }`;
export const DELETE_PROFILE_LANGUAGE = gql`mutation DeleteProfileLanguage($language: DeleteProfileLanguageInput!) { deleteProfileLanguage(language: $language) { id } }`;
export const ADD_CV_SKILL = gql`mutation AddCvSkill($skill: AddCvSkillInput!) { addCvSkill(skill: $skill) { id } }`;
export const UPDATE_CV_SKILL = gql`mutation UpdateCvSkill($skill: UpdateCvSkillInput!) { updateCvSkill(skill: $skill) { id } }`;
export const DELETE_CV_SKILL = gql`mutation DeleteCvSkill($skill: DeleteCvSkillInput!) { deleteCvSkill(skill: $skill) { id } }`;
export const ADD_CV_PROJECT = gql`mutation AddCvProject($project: AddCvProjectInput!) { addCvProject(project: $project) { id } }`;
export const UPDATE_CV_PROJECT = gql`mutation UpdateCvProject($project: UpdateCvProjectInput!) { updateCvProject(project: $project) { id } }`;
export const REMOVE_CV_PROJECT = gql`mutation RemoveCvProject($project: RemoveCvProjectInput!) { removeCvProject(project: $project) { id } }`;
export const EXPORT_PDF = gql`mutation ExportCvPdf($pdf: ExportPdfInput!) { exportPdf(pdf: $pdf) }`;

export const PROJECTS_QUERY: TypedDocumentNode<{ projects: CatalogPage<ApiProject> }, PageVariables> = gql`
  query CvProjectCatalog($params: SearchPaginationInput) {
    projects(params: $params) {
      items { id name domain description environment start_date end_date }
      total_pages
    }
  }
`;

export function toCvRecord(cv: ApiCv): CvRecord {
  return {
    id: cv.id,
    name: cv.name,
    education: cv.education ?? "",
    description: cv.description,
    employee: cv.user?.email ?? "",
    ownerId: cv.user?.id ?? "",
    position: cv.user?.position?.name ?? "",
  };
}

export function toCvProjects(cv: ApiCv): CvProjectEntry[] {
  return (cv.projects ?? []).map((entry) => ({
    projectId: entry.project.id,
    startDate: entry.start_date.slice(0, 10),
    endDate: entry.end_date?.slice(0, 10) ?? "",
    roles: entry.roles,
    responsibilities: entry.responsibilities,
  }));
}

export function toCatalogProject(project: ApiProject): CatalogProject {
  return {
    id: project.id,
    name: project.name,
    domain: project.domain,
    description: project.description,
    environment: project.environment,
    startDate: project.start_date.slice(0, 10),
    endDate: project.end_date?.slice(0, 10) ?? null,
  };
}

export function toCvSkills(skills: ApiSkillMastery[], categories: Map<string, string>): CvSkill[] {
  return skills.map((skill) => ({
    name: skill.name,
    category: skill.categoryId ? categories.get(skill.categoryId) ?? "Other" : "Other",
    categoryId: skill.categoryId,
    mastery: skill.mastery,
  }));
}

export async function loadCvs(client: ApolloClient): Promise<ApiCv[]> {
  return loadAllCatalogItems(client, CVS_QUERY, "cvs");
}

export async function loadProjects(client: ApolloClient): Promise<CatalogProject[]> {
  return (await loadAllCatalogItems(client, PROJECTS_QUERY, "projects")).map(toCatalogProject);
}

export function languageInput(userId: string, language: { name: string; proficiency: LanguageProficiency }) {
  return { userId, ...language };
}
