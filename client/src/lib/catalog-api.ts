import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client";

export type CatalogPage<T> = { items: T[]; total_pages: number };
type PageVariables = { params: { page: number; limit: number } };

export async function loadAllCatalogItems<T>(
  client: ApolloClient,
  query: TypedDocumentNode<Record<string, CatalogPage<T>>, PageVariables>,
  field: string,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const { data } = await client.query({
      query,
      variables: { params: { page, limit: 100 } },
      fetchPolicy: "network-only",
    });
    const result = data?.[field];
    if (!result) throw new Error(`Missing ${field} data`);
    items.push(...result.items);
    if (page >= result.total_pages) return items;
  }
}

export const DEPARTMENTS_QUERY: TypedDocumentNode<Record<string, CatalogPage<{ id: string; name: string }>>, PageVariables> = gql`
  query CatalogDepartments($params: SearchPaginationInput) {
    departments(params: $params) { items { id name } total_pages }
  }
`;

export const POSITIONS_QUERY: TypedDocumentNode<Record<string, CatalogPage<{ id: string; name: string }>>, PageVariables> = gql`
  query CatalogPositions($params: SearchPaginationInput) {
    positions(params: $params) { items { id name } total_pages }
  }
`;

export type ApiLanguage = { id: string; name: string; iso2: string; native_name: string | null };
export const LANGUAGES_QUERY: TypedDocumentNode<Record<string, CatalogPage<ApiLanguage>>, PageVariables> = gql`
  query CatalogLanguages($params: SearchPaginationInput) {
    languages(params: $params) { items { id name iso2 native_name } total_pages }
  }
`;

export type ApiSkill = { id: string; name: string; category: { id: string; name: string; parent: { name: string } | null } };
export const SKILLS_QUERY: TypedDocumentNode<Record<string, CatalogPage<ApiSkill>>, PageVariables> = gql`
  query CatalogSkills($params: SearchPaginationInput) {
    skills(params: $params) { items { id name category { id name parent { name } } } total_pages }
  }
`;

export type ApiSkillCategory = { id: string; name: string; parent: { name: string } | null };
export const SKILL_CATEGORIES_QUERY: TypedDocumentNode<{ skillCategories: ApiSkillCategory[] }> = gql`
  query CatalogSkillCategories { skillCategories { id name parent { name } } }
`;

export const CREATE_DEPARTMENT = gql`mutation CatalogCreateDepartment($department: CreateDepartmentInput!) { createDepartment(department: $department) { id name } }`;
export const UPDATE_DEPARTMENT = gql`mutation CatalogUpdateDepartment($department: UpdateDepartmentInput!) { updateDepartment(department: $department) { id name } }`;
export const DELETE_DEPARTMENT = gql`mutation CatalogDeleteDepartment($department: DeleteDepartmentInput!) { deleteDepartment(department: $department) { affected } }`;
export const CREATE_POSITION = gql`mutation CatalogCreatePosition($position: CreatePositionInput!) { createPosition(position: $position) { id name } }`;
export const UPDATE_POSITION = gql`mutation CatalogUpdatePosition($position: UpdatePositionInput!) { updatePosition(position: $position) { id name } }`;
export const DELETE_POSITION = gql`mutation CatalogDeletePosition($position: DeletePositionInput!) { deletePosition(position: $position) { affected } }`;
export const CREATE_LANGUAGE = gql`mutation CatalogCreateLanguage($language: CreateLanguageInput!) { createLanguage(language: $language) { id name iso2 native_name } }`;
export const UPDATE_LANGUAGE = gql`mutation CatalogUpdateLanguage($language: UpdateLanguageInput!) { updateLanguage(language: $language) { id name iso2 native_name } }`;
export const DELETE_LANGUAGE = gql`mutation CatalogDeleteLanguage($language: DeleteLanguageInput!) { deleteLanguage(language: $language) { affected } }`;
export const CREATE_SKILL = gql`mutation CatalogCreateSkill($skill: CreateSkillInput!) { createSkill(skill: $skill) { id name category { id name parent { name } } } }`;
export const UPDATE_SKILL = gql`mutation CatalogUpdateSkill($skill: UpdateSkillInput!) { updateSkill(skill: $skill) { id name category { id name parent { name } } } }`;
export const DELETE_SKILL = gql`mutation CatalogDeleteSkill($skill: DeleteSkillInput!) { deleteSkill(skill: $skill) { affected } }`;
