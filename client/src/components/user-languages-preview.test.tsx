import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import type { ComponentProps } from "react";
import { Provider } from "react-redux";
import { sessionStarted } from "@/lib/auth/model/auth-slice";
import { ADD_PROFILE_LANGUAGE, CVS_QUERY, ME_QUERY, PROJECTS_QUERY } from "@/lib/cv-api";
import { LANGUAGES_QUERY, POSITIONS_QUERY, SKILL_CATEGORIES_QUERY, SKILLS_QUERY } from "@/lib/catalog-api";
import { makeStore } from "@/lib/store";
import { CvPreviewProvider } from "@/components/profile-cvs-data";
import { LanguagePreviewProvider } from "@/components/profile-languages-data";
import { UserLanguagesPreview } from "@/components/user-languages-preview";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

const initial = [{ name: "English", proficiency: "B2" }, { name: "Russian", proficiency: "Native" }];
function loadMocks(languages: typeof initial) {
  return [
    { request: { query: CVS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { cvs: { items: [], total_pages: 0 } } } },
    { request: { query: PROJECTS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { projects: { items: [], total_pages: 0 } } } },
    { request: { query: ME_QUERY }, result: { data: { me: { id: "user-1", created_at: "2026-01-01", first_name: "A", last_name: "B", full_name: "A B", avatar: null, email: "user@example.com", is_verified: true, skills: [], languages } } } },
    { request: { query: SKILL_CATEGORIES_QUERY }, result: { data: { skillCategories: [] } } },
    { request: { query: SKILLS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { skills: { items: [], total_pages: 0 } } } },
    { request: { query: POSITIONS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { positions: { items: [], total_pages: 0 } } } },
  ];
}
function renderPage(mocks: ComponentProps<typeof MockedProvider>["mocks"]) {
  const store = makeStore();
  store.dispatch(sessionStarted({ user: { id: "user-1", email: "user@example.com", role: "Employee", is_verified: true }, accessToken: "token" }));
  render(<Provider store={store}><MockedProvider mocks={mocks}><CvPreviewProvider><LanguagePreviewProvider><UserLanguagesPreview /></LanguagePreviewProvider></CvPreviewProvider></MockedProvider></Provider>);
}

describe("personal languages with GraphQL", () => {
  it("loads the current profile and adds a catalog language", async () => {
    const mocks = [
      ...loadMocks(initial),
      { request: { query: LANGUAGES_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { languages: { items: [
        { id: "1", name: "English", iso2: "EN", native_name: "English" },
        { id: "2", name: "Russian", iso2: "RU", native_name: "Русский" },
        { id: "3", name: "German", iso2: "DE", native_name: "Deutsch" },
      ], total_pages: 1 } } } },
      { request: { query: ADD_PROFILE_LANGUAGE, variables: { language: { userId: "user-1", name: "German", proficiency: "B1" } } }, result: { data: { addProfileLanguage: { id: "user-1" } } } },
      ...loadMocks([...initial, { name: "German", proficiency: "B1" }]),
    ];
    renderPage(mocks);
    expect(await screen.findByRole("button", { name: "Russian, Native, edit language" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add language" }));
    const dialog = screen.getByRole("dialog", { name: "Add language" });
    const name = within(dialog).getByRole("combobox", { name: /^Language$/ });
    fireEvent.change(name, { target: { value: "English" } });
    expect(within(dialog).getByText("Language already exists")).toBeVisible();
    fireEvent.change(name, { target: { value: "German" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Language proficiency" }), { target: { value: "B1" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await screen.findByRole("button", { name: "German, B1, edit language" })).toBeVisible();
  });
});
