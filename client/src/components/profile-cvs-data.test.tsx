import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store";
import { sessionStarted } from "@/lib/auth/model/auth-slice";
import { CvPreviewProvider, useCvPreviewData } from "./profile-cvs-data";
import {
  ADD_CV_PROJECT, ADD_CV_SKILL, ADD_PROFILE_SKILL, CREATE_CV, CV_QUERY, CVS_QUERY,
  DELETE_CV, DELETE_CV_SKILL, DELETE_PROFILE_SKILL, ME_QUERY, PROFILE_QUERY,
  PROJECTS_QUERY, REMOVE_CV_PROJECT, UPDATE_CV, UPDATE_CV_PROJECT, UPDATE_CV_SKILL,
  UPDATE_PROFILE_SKILL, type ApiCv, type ApiProfile,
} from "@/lib/cv-api";
import { POSITIONS_QUERY, SKILL_CATEGORIES_QUERY, SKILLS_QUERY } from "@/lib/catalog-api";

const api = vi.hoisted(() => ({ query: vi.fn(), mutate: vi.fn() }));
vi.mock("@apollo/client/react", () => ({ useApolloClient: () => api }));

afterEach(cleanup);

function Probe() {
  const data = useCvPreviewData();
  return <>
    <output data-testid="state">{data.loadState}</output>
    <output data-testid="cvs">{data.cvs.map((cv) => cv.name).join(",")}</output>
    <output data-testid="cv-skills">{data.cvSkills["cv-1"]?.map((skill) => `${skill.name}:${skill.mastery}`).join(",")}</output>
    <output data-testid="cv-projects">{data.cvProjects["cv-1"]?.map((project) => project.roles.join("/")).join(",")}</output>
    <output data-testid="user-skills">{data.userSkills.map((skill) => `${skill.name}:${skill.mastery}`).join(",")}</output>
    <output data-testid="roles">{data.projectRoles.join(",")}</output>
    <button onClick={() => { void data.loadCv("cv-1"); }}>Load CV</button>
    <button onClick={() => { void data.updateCv("cv-1", { name: "Updated CV", education: "University", description: "Summary" }); }}>Update CV</button>
    <button onClick={() => { void data.addCvSkill("cv-1", "TypeScript", "Advanced"); }}>Add CV skill</button>
    <button onClick={() => { void data.updateCvSkill("cv-1", "TypeScript", "Expert"); }}>Update CV skill</button>
    <button onClick={() => { void data.removeCvSkills("cv-1", ["TypeScript"]); }}>Remove CV skill</button>
    <button onClick={() => { void data.addCvProject("cv-1", { projectId: "project-1", startDate: "2025-01-01", endDate: "", roles: ["Engineer"], responsibilities: [] }); }}>Add CV project</button>
    <button onClick={() => { void data.updateCvProject("cv-1", { projectId: "project-1", startDate: "2025-01-01", endDate: "", roles: ["Lead"], responsibilities: ["Build UI"] }); }}>Update CV project</button>
    <button onClick={() => { void data.removeCvProject("cv-1", "project-1"); }}>Remove CV project</button>
    <button onClick={() => { void data.addUserSkill("Node.js", "Advanced"); }}>Add user skill</button>
    <button onClick={() => { void data.updateUserSkill("Node.js", "Expert"); }}>Update user skill</button>
    <button onClick={() => { void data.removeUserSkills(["Node.js"]); }}>Remove user skill</button>
    <button onClick={() => { void data.deleteCv("cv-1"); }}>Delete CV</button>
    <button onClick={() => { void data.createCv({ name: "New CV", education: "University", description: "Summary" }); }}>Create CV</button>
  </>;
}

it("keeps CV, profile, project and role data in sync with GraphQL mutations", async () => {
  const cv: ApiCv = {
    id: "cv-1", name: "Original CV", education: "University", description: "Summary",
    user: { id: "user-1", email: "ada@example.com", position: { name: "Engineer" } },
    skills: [{ name: "React", categoryId: "category-1", mastery: "Proficient" }],
    languages: [], projects: [],
  };
  const profile: ApiProfile = {
    id: "user-1", created_at: "2025-01-01", first_name: "Ada", last_name: "Lovelace",
    full_name: "Ada Lovelace", avatar: null, email: "ada@example.com", is_verified: true,
    skills: [{ name: "React", categoryId: "category-1", mastery: "Proficient" }, { name: "TypeScript", categoryId: "category-1", mastery: "Proficient" }], languages: [],
  };
  let cvs = [cv];
  api.query.mockReset().mockImplementation(async ({ query }) => {
    if (query === CVS_QUERY) return { data: { cvs: { items: cvs, total_pages: 1 } } };
    if (query === CV_QUERY) return { data: { cv } };
    if (query === PROJECTS_QUERY) return { data: { projects: { items: [{ id: "project-1", name: "Portal", domain: "Finance", description: "Portal", environment: ["React"], start_date: "2025-01-01", end_date: null }], total_pages: 1 } } };
    if (query === ME_QUERY) return { data: { me: profile } };
    if (query === PROFILE_QUERY) return { data: { profile } };
    if (query === SKILL_CATEGORIES_QUERY) return { data: { skillCategories: [{ id: "category-1", name: "Frontend", parent: null }] } };
    if (query === SKILLS_QUERY) return { data: { skills: { items: [{ id: "1", name: "React", category: { id: "category-1", name: "Frontend", parent: null } }, { id: "2", name: "TypeScript", category: { id: "category-1", name: "Frontend", parent: null } }, { id: "3", name: "Node.js", category: { id: "category-1", name: "Frontend", parent: null } }], total_pages: 1 } } };
    if (query === POSITIONS_QUERY) return { data: { positions: { items: [{ id: "1", name: "Engineer" }, { id: "2", name: "Lead" }], total_pages: 1 } } };
    throw new Error("Unexpected query");
  });
  api.mutate.mockReset().mockImplementation(async ({ mutation, variables }) => {
    if (mutation === UPDATE_CV) Object.assign(cv, variables.cv);
    else if (mutation === ADD_CV_SKILL) cv.skills.push({ name: variables.skill.name, categoryId: variables.skill.categoryId, mastery: variables.skill.mastery });
    else if (mutation === UPDATE_CV_SKILL) cv.skills.find((item) => item.name === variables.skill.name)!.mastery = variables.skill.mastery;
    else if (mutation === DELETE_CV_SKILL) cv.skills = cv.skills.filter((item) => !variables.skill.name.includes(item.name));
    else if (mutation === ADD_CV_PROJECT) cv.projects!.push({ project: { id: "project-1", name: "Portal", domain: "Finance", description: "Portal", environment: ["React"], start_date: "2025-01-01", end_date: null }, start_date: variables.project.start_date, end_date: null, roles: variables.project.roles, responsibilities: [] });
    else if (mutation === UPDATE_CV_PROJECT) Object.assign(cv.projects![0], { roles: variables.project.roles, responsibilities: variables.project.responsibilities });
    else if (mutation === REMOVE_CV_PROJECT) cv.projects = [];
    else if (mutation === ADD_PROFILE_SKILL) profile.skills.push({ name: variables.skill.name, categoryId: variables.skill.categoryId, mastery: variables.skill.mastery });
    else if (mutation === UPDATE_PROFILE_SKILL) profile.skills.find((item) => item.name === variables.skill.name)!.mastery = variables.skill.mastery;
    else if (mutation === DELETE_PROFILE_SKILL) profile.skills = profile.skills.filter((item) => !variables.skill.name.includes(item.name));
    else if (mutation === DELETE_CV) cvs = [];
    else if (mutation === CREATE_CV) cvs = [{ ...cv, id: "cv-2", name: variables.cv.name }];
    else throw new Error("Unexpected mutation");
    return { data: {} };
  });

  const store = makeStore();
  store.dispatch(sessionStarted({ user: { id: "user-1", email: "ada@example.com", role: "Employee", is_verified: true }, accessToken: "token" }));
  render(<Provider store={store}><CvPreviewProvider><Probe /></CvPreviewProvider></Provider>);
  await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ready"));
  expect(screen.getByTestId("roles")).toHaveTextContent("Engineer,Lead");

  fireEvent.click(screen.getByRole("button", { name: "Load CV" }));
  await waitFor(() => expect(screen.getByTestId("cv-skills")).toHaveTextContent("React:Proficient"));
  fireEvent.click(screen.getByRole("button", { name: "Update CV" }));
  await waitFor(() => expect(screen.getByTestId("cvs")).toHaveTextContent("Updated CV"));
  fireEvent.click(screen.getByRole("button", { name: "Add CV skill" }));
  await waitFor(() => expect(screen.getByTestId("cv-skills")).toHaveTextContent("TypeScript:Advanced"));
  fireEvent.click(screen.getByRole("button", { name: "Update CV skill" }));
  await waitFor(() => expect(screen.getByTestId("cv-skills")).toHaveTextContent("TypeScript:Expert"));
  fireEvent.click(screen.getByRole("button", { name: "Remove CV skill" }));
  await waitFor(() => expect(screen.getByTestId("cv-skills")).not.toHaveTextContent("TypeScript"));
  fireEvent.click(screen.getByRole("button", { name: "Add CV project" }));
  await waitFor(() => expect(screen.getByTestId("cv-projects")).toHaveTextContent("Engineer"));
  fireEvent.click(screen.getByRole("button", { name: "Update CV project" }));
  await waitFor(() => expect(screen.getByTestId("cv-projects")).toHaveTextContent("Lead"));
  fireEvent.click(screen.getByRole("button", { name: "Remove CV project" }));
  await waitFor(() => expect(screen.getByTestId("cv-projects")).toBeEmptyDOMElement());
  fireEvent.click(screen.getByRole("button", { name: "Add user skill" }));
  await waitFor(() => expect(screen.getByTestId("user-skills")).toHaveTextContent("Node.js:Advanced"));
  fireEvent.click(screen.getByRole("button", { name: "Update user skill" }));
  await waitFor(() => expect(screen.getByTestId("user-skills")).toHaveTextContent("Node.js:Expert"));
  fireEvent.click(screen.getByRole("button", { name: "Remove user skill" }));
  await waitFor(() => expect(screen.getByTestId("user-skills")).not.toHaveTextContent("Node.js"));
  fireEvent.click(screen.getByRole("button", { name: "Delete CV" }));
  await waitFor(() => expect(screen.getByTestId("cvs")).toBeEmptyDOMElement());
  fireEvent.click(screen.getByRole("button", { name: "Create CV" }));
  await waitFor(() => expect(screen.getByTestId("cvs")).toHaveTextContent("New CV"));
  expect(api.mutate).toHaveBeenCalledTimes(12);
  expect(api.mutate).toHaveBeenCalledWith(expect.objectContaining({ mutation: ADD_CV_PROJECT, variables: { project: { cvId: "cv-1", projectId: "project-1", start_date: "2025-01-01", end_date: null, roles: ["Engineer"], responsibilities: [] } } }));
});
