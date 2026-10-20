import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { Provider } from "react-redux";
import { sessionStarted } from "@/lib/auth/model/auth-slice";
import { CVS_QUERY, ME_QUERY, PROJECTS_QUERY } from "@/lib/cv-api";
import { SKILL_CATEGORIES_QUERY, SKILLS_QUERY } from "@/lib/catalog-api";
import { makeStore } from "@/lib/store";
import { CvPreviewProvider } from "@/components/profile-cvs-data";
import { ProfileCvsPreview } from "@/components/profile-cvs-preview";

afterEach(cleanup);

const cv = {
  id: "cv-1", name: "Frontend CV", education: "Computer Science", description: "Frontend applications",
  user: { id: "user-1", email: "employee@example.com", position: { name: "Engineer" } },
  skills: [], languages: [],
};
const mocks = [
  { request: { query: CVS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { cvs: { items: [cv], total_pages: 1 } } } },
  { request: { query: PROJECTS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { projects: { items: [], total_pages: 0 } } } },
  { request: { query: ME_QUERY }, result: { data: { me: { id: "user-1", created_at: "2026-01-01", first_name: "A", last_name: "B", full_name: "A B", avatar: null, email: "employee@example.com", is_verified: true, skills: [], languages: [] } } } },
  { request: { query: SKILL_CATEGORIES_QUERY }, result: { data: { skillCategories: [] } } },
  { request: { query: SKILLS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { skills: { items: [], total_pages: 0 } } } },
];

function renderPage(view: "profile" | "admin" | "employee") {
  const store = makeStore();
  store.dispatch(sessionStarted({ user: { id: "user-1", email: "employee@example.com", role: view === "employee" ? "Employee" : "Admin", is_verified: true }, accessToken: "token" }));
  return render(<Provider store={store}><MockedProvider mocks={mocks}><CvPreviewProvider><ProfileCvsPreview view={view} /></CvPreviewProvider></MockedProvider></Provider>);
}

describe("CV links with GraphQL data", () => {
  it.each([
    ["profile", "/admin/profile/cvs/cv-1"],
    ["admin", "/admin/cvs/cv-1"],
    ["employee", "/cvs/cv-1"],
  ] as const)("opens a loaded CV from the %s view", async (view, href) => {
    renderPage(view);
    fireEvent.click(await screen.findByRole("button", { name: "Actions for Frontend CV" }, { timeout: 5000 }));
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute("href", href);
  });
});
