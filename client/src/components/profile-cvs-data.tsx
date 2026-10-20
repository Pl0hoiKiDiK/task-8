"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useApolloClient } from "@apollo/client/react";
import { loadAllCatalogItems, POSITIONS_QUERY, SKILL_CATEGORIES_QUERY, SKILLS_QUERY } from "@/lib/catalog-api";
import {
  ADD_CV_PROJECT, ADD_CV_SKILL, ADD_PROFILE_SKILL, CREATE_CV, CV_QUERY, DELETE_CV,
  DELETE_CV_SKILL, DELETE_PROFILE_SKILL, loadCvs, loadProjects, ME_QUERY, PROFILE_QUERY,
  REMOVE_CV_PROJECT, toCvProjects, toCvRecord, toCvSkills, UPDATE_CV, UPDATE_CV_PROJECT,
  UPDATE_CV_SKILL, UPDATE_PROFILE_SKILL, type ApiCv, type ApiProfile,
} from "@/lib/cv-api";
import { useAppSelector } from "@/lib/hooks";
import type { CvSkill, SkillMastery } from "@/components/cv-skills-data";
import type { ProfileLanguage } from "@/components/profile-languages-data";
import { validateCvProject, type CatalogProject, type CvProjectEntry, type CvProjectFields } from "@/components/cv-projects-data";

export type CvRecord = {
  id: string;
  name: string;
  education: string;
  employee: string;
  description: string;
  ownerId?: string;
  position?: string;
};
export type CvFields = Pick<CvRecord, "name" | "education" | "description">;
type LoadState = "loading" | "ready" | "error";

type CvData = {
  currentUserId: string;
  currentUserEmail: string;
  cvs: CvRecord[];
  loadState: LoadState;
  reload: () => Promise<void>;
  loadCv: (cvId: string) => Promise<void>;
  createCv: (fields: CvFields, ownerId?: string) => Promise<void>;
  updateCv: (id: string, fields: CvFields) => Promise<void>;
  deleteCv: (id: string) => Promise<void>;
  cvSkills: Record<string, CvSkill[]>;
  cvLanguages: Record<string, ProfileLanguage[]>;
  addCvSkill: (cvId: string, name: string, mastery: SkillMastery) => Promise<void>;
  updateCvSkill: (cvId: string, name: string, mastery: SkillMastery) => Promise<void>;
  removeCvSkills: (cvId: string, names: string[]) => Promise<void>;
  cvProjects: Record<string, CvProjectEntry[]>;
  projectCatalog: CatalogProject[];
  projectRoles: string[];
  projectRolesState: LoadState;
  reloadProjectRoles: () => Promise<void>;
  addCvProject: (cvId: string, fields: CvProjectFields) => Promise<void>;
  updateCvProject: (cvId: string, fields: CvProjectFields) => Promise<void>;
  removeCvProject: (cvId: string, projectId: string) => Promise<void>;
  userSkills: CvSkill[];
  skillCatalog: CvSkill[];
  ownerSkills: Record<string, CvSkill[]>;
  loadOwnerSkills: (userId: string) => Promise<void>;
  addUserSkill: (name: string, mastery: SkillMastery) => Promise<void>;
  updateUserSkill: (name: string, mastery: SkillMastery) => Promise<void>;
  removeUserSkills: (names: string[]) => Promise<void>;
  profile: ApiProfile | null;
};

const CvDataContext = createContext<CvData | null>(null);

export function CvPreviewProvider({ children, targetUserId, targetUserEmail, targetIsVerified }: {
  children: ReactNode;
  targetUserId?: string;
  targetUserEmail?: string;
  targetIsVerified?: boolean;
}) {
  const client = useApolloClient();
  const auth = useAppSelector((state) => state.auth);
  const ownUserId = auth.user?.id ?? "";
  const userId = targetUserId ?? ownUserId;
  const userEmail = targetUserEmail ?? auth.user?.email ?? "";
  const [cvs, setCvs] = useState<CvRecord[]>([]);
  const [cvSkills, setCvSkills] = useState<Record<string, CvSkill[]>>({});
  const [cvLanguages, setCvLanguages] = useState<Record<string, ProfileLanguage[]>>({});
  const [cvProjects, setCvProjects] = useState<Record<string, CvProjectEntry[]>>({});
  const [projectCatalog, setProjectCatalog] = useState<CatalogProject[]>([]);
  const [projectRoles, setProjectRoles] = useState<string[]>([]);
  const [projectRolesState, setProjectRolesState] = useState<LoadState>("loading");
  const [userSkills, setUserSkills] = useState<CvSkill[]>([]);
  const [skillCatalog, setSkillCatalog] = useState<CvSkill[]>([]);
  const [ownerSkills, setOwnerSkills] = useState<Record<string, CvSkill[]>>({});
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [categories, setCategories] = useState<Map<string, string>>(new Map());

  const reloadProjectRoles = useCallback(async () => {
    setProjectRolesState("loading");
    try {
      const positions = await loadAllCatalogItems(client, POSITIONS_QUERY, "positions");
      setProjectRoles(positions.map((position) => position.name));
      setProjectRolesState("ready");
    } catch (error) {
      setProjectRolesState("error");
      throw error;
    }
  }, [client]);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoadState("loading");
    try {
      const profileRequest = targetUserId && targetUserId !== ownUserId
        ? client.query({ query: PROFILE_QUERY, variables: { userId }, fetchPolicy: "network-only" }).then((result) => result.data?.profile)
        : client.query({ query: ME_QUERY, fetchPolicy: "network-only" }).then((result) => result.data?.me);
      const [records, projects, profileResult, categoriesResult, skills] = await Promise.all([
        loadCvs(client), loadProjects(client),
        profileRequest,
        client.query({ query: SKILL_CATEGORIES_QUERY, fetchPolicy: "network-only" }),
        loadAllCatalogItems(client, SKILLS_QUERY, "skills"),
      ]);
      if (!profileResult || !categoriesResult.data?.skillCategories) throw new Error("Missing profile data");
      const categoryNames = new Map(categoriesResult.data.skillCategories.map((item) => [item.id, item.name]));
      setCategories(categoryNames);
      setCvs(records.map(toCvRecord));
      setCvSkills(Object.fromEntries(records.map((cv) => [cv.id, toCvSkills(cv.skills, categoryNames)])));
      setCvLanguages(Object.fromEntries(records.map((cv) => [cv.id, cv.languages])));
      setProjectCatalog(projects);
      setProfile({ ...profileResult, email: targetUserEmail ?? profileResult.email, is_verified: targetIsVerified ?? profileResult.is_verified });
      const ownSkills = toCvSkills(profileResult.skills, categoryNames);
      setUserSkills(ownSkills);
      setOwnerSkills((current) => ({ ...current, [userId]: ownSkills }));
      setSkillCatalog(skills.map((skill) => ({ name: skill.name, category: skill.category.name, categoryId: skill.category.id, mastery: "Novice" as SkillMastery })));
      setLoadState("ready");
    } catch (error) {
      setLoadState("error");
      throw error;
    }
  }, [client, ownUserId, targetIsVerified, targetUserEmail, targetUserId, userId]);

  useEffect(() => {
    if (auth.status !== "ready" || !userId) return;
    const timer = window.setTimeout(() => { void reload().catch(() => undefined); }, 0);
    return () => window.clearTimeout(timer);
  }, [auth.status, reload, userId]);

  useEffect(() => {
    if (auth.status !== "ready" || !userId) return;
    const timer = window.setTimeout(() => { void reloadProjectRoles().catch(() => undefined); }, 0);
    return () => window.clearTimeout(timer);
  }, [auth.status, reloadProjectRoles, userId]);

  const loadCv = useCallback(async (cvId: string) => {
    const { data } = await client.query({ query: CV_QUERY, variables: { cvId }, fetchPolicy: "network-only" });
    if (!data?.cv) throw new Error("CV was not found");
    const cv: ApiCv = data.cv;
    setCvs((current) => current.some((item) => item.id === cv.id)
      ? current.map((item) => item.id === cv.id ? toCvRecord(cv) : item)
      : [...current, toCvRecord(cv)]);
    setCvSkills((current) => ({ ...current, [cv.id]: toCvSkills(cv.skills, categories) }));
    setCvLanguages((current) => ({ ...current, [cv.id]: cv.languages }));
    setCvProjects((current) => ({ ...current, [cv.id]: toCvProjects(cv) }));
  }, [categories, client]);

  const loadOwnerSkills = useCallback(async (ownerId: string) => {
    if (!ownerId || ownerSkills[ownerId]) return;
    const { data } = await client.query({ query: PROFILE_QUERY, variables: { userId: ownerId }, fetchPolicy: "network-only" });
    if (!data?.profile) throw new Error("Profile was not found");
    setOwnerSkills((current) => ({ ...current, [ownerId]: toCvSkills(data.profile.skills, categories) }));
  }, [categories, client, ownerSkills]);

  async function mutateAndReload(mutation: Parameters<typeof client.mutate>[0]["mutation"], variables: Record<string, unknown>, cvId?: string) {
    await client.mutate({ mutation, variables });
    await reload();
    if (cvId) await loadCv(cvId);
  }

  async function createCv(fields: CvFields, ownerId = userId) {
    if (!ownerId) throw new Error("CV owner is required");
    await mutateAndReload(CREATE_CV, { cv: { ...fields, userId: ownerId } });
  }
  async function updateCv(id: string, fields: CvFields) {
    await mutateAndReload(UPDATE_CV, { cv: { cvId: id, ...fields } }, id);
  }
  async function deleteCv(id: string) {
    await mutateAndReload(DELETE_CV, { cv: { cvId: id } });
    setCvProjects((current) => Object.fromEntries(Object.entries(current).filter(([cvId]) => cvId !== id)));
  }

  async function addCvSkill(cvId: string, name: string, mastery: SkillMastery) {
    const ownerId = cvs.find((cv) => cv.id === cvId)?.ownerId;
    const skill = ownerSkills[ownerId ?? ""]?.find((item) => item.name === name);
    if (!skill) throw new Error("Skill is unavailable");
    await mutateAndReload(ADD_CV_SKILL, { skill: { cvId, name, mastery, categoryId: skill.categoryId ?? null } }, cvId);
  }
  async function updateCvSkill(cvId: string, name: string, mastery: SkillMastery) {
    await mutateAndReload(UPDATE_CV_SKILL, { skill: { cvId, name, mastery, categoryId: cvSkills[cvId]?.find((item) => item.name === name)?.categoryId ?? null } }, cvId);
  }
  async function removeCvSkills(cvId: string, names: string[]) {
    await mutateAndReload(DELETE_CV_SKILL, { skill: { cvId, name: names } }, cvId);
  }

  async function saveProject(mutation: Parameters<typeof client.mutate>[0]["mutation"], cvId: string, fields: CvProjectFields) {
    if (Object.keys(validateCvProject(fields, projectCatalog)).length) throw new Error("Project information is invalid");
    await mutateAndReload(mutation, { project: {
      cvId, projectId: fields.projectId, start_date: fields.startDate,
      end_date: fields.endDate || null, roles: fields.roles, responsibilities: fields.responsibilities,
    } }, cvId);
  }
  async function addCvProject(cvId: string, fields: CvProjectFields) {
    if (cvProjects[cvId]?.some((entry) => entry.projectId === fields.projectId)) throw new Error("Project already added");
    await saveProject(ADD_CV_PROJECT, cvId, fields);
  }
  async function updateCvProject(cvId: string, fields: CvProjectFields) {
    await saveProject(UPDATE_CV_PROJECT, cvId, fields);
  }
  async function removeCvProject(cvId: string, projectId: string) {
    await mutateAndReload(REMOVE_CV_PROJECT, { project: { cvId, projectId } }, cvId);
  }

  async function addUserSkill(name: string, mastery: SkillMastery) {
    const skill = skillCatalog.find((item) => item.name === name);
    if (!skill || userSkills.some((item) => item.name === name)) throw new Error("Skill already exists");
    await mutateAndReload(ADD_PROFILE_SKILL, { skill: { userId, name, mastery, categoryId: skill.categoryId ?? null } });
  }
  async function updateUserSkill(name: string, mastery: SkillMastery) {
    await mutateAndReload(UPDATE_PROFILE_SKILL, { skill: { userId, name, mastery, categoryId: userSkills.find((item) => item.name === name)?.categoryId ?? null } });
  }
  async function removeUserSkills(names: string[]) {
    await mutateAndReload(DELETE_PROFILE_SKILL, { skill: { userId, name: names } });
  }

  return <CvDataContext.Provider value={{
    currentUserId: userId, currentUserEmail: userEmail, cvs, loadState, reload, loadCv,
    createCv, updateCv, deleteCv, cvSkills, cvLanguages, addCvSkill, updateCvSkill, removeCvSkills,
    cvProjects, projectCatalog, projectRoles, projectRolesState, reloadProjectRoles,
    addCvProject, updateCvProject, removeCvProject,
    userSkills, skillCatalog, ownerSkills, loadOwnerSkills,
    addUserSkill, updateUserSkill, removeUserSkills, profile,
  }}>{children}</CvDataContext.Provider>;
}

export function useCvPreviewData() {
  const context = useContext(CvDataContext);
  if (!context) throw new Error("CV data provider is missing");
  return context;
}
