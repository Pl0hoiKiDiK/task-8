import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import type { ComponentProps } from "react";
import { Provider } from "react-redux";
import { sessionStarted } from "@/lib/auth/model/auth-slice";
import { ADD_PROFILE_LANGUAGE, CVS_QUERY, DELETE_PROFILE_LANGUAGE, ME_QUERY, PROJECTS_QUERY, UPDATE_PROFILE_LANGUAGE } from "@/lib/cv-api";
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
const catalogLanguages = { request: { query: LANGUAGES_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { languages: { items: [
  { id: "1", name: "English", iso2: "EN", native_name: "English" },
  { id: "2", name: "Russian", iso2: "RU", native_name: "Русский" },
  { id: "3", name: "German", iso2: "DE", native_name: "Deutsch" },
], total_pages: 1 } } } };
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
      catalogLanguages,
      { request: { query: ADD_PROFILE_LANGUAGE, variables: { language: { userId: "user-1", name: "German", proficiency: "B1" } } }, result: { data: { addProfileLanguage: { id: "user-1" } } } },
      ...loadMocks([...initial, { name: "German", proficiency: "B1" }]),
      { request: { query: UPDATE_PROFILE_LANGUAGE, variables: { language: { userId: "user-1", name: "German", proficiency: "C1" } } }, result: { data: { updateProfileLanguage: { id: "user-1" } } } },
      ...loadMocks([...initial, { name: "German", proficiency: "C1" }]),
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
    fireEvent.click(within(dialog).getByRole("button", { name: /^Add$/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "German, B1, edit language" })).toBeVisible());

    fireEvent.click(screen.getByRole("button", { name: "German, B1, edit language" }));
    const edit = screen.getByRole("dialog", { name: "Edit language" });
    expect(within(edit).getByRole("combobox", { name: /^Language$/ })).toBeDisabled();
    fireEvent.change(within(edit).getByRole("combobox", { name: "Language proficiency" }), { target: { value: "C1" } });
    fireEvent.click(within(edit).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "German, C1, edit language" })).toBeVisible());

    fireEvent.click(screen.getByRole("button", { name: "Add language" }));
    expect(within(screen.getByRole("dialog", { name: "Add language" })).getByRole("combobox", { name: /^Language$/ })).toHaveValue("");
  });

  it("clears selection on cancel and removes multiple languages after confirmation", async () => {
    renderPage([
      ...loadMocks(initial), catalogLanguages,
      { request: { query: DELETE_PROFILE_LANGUAGE, variables: { language: { userId: "user-1", name: ["Russian", "English"] } } }, result: { data: { deleteProfileLanguage: { id: "user-1" } } } },
      ...loadMocks([]),
    ]);
    expect(await screen.findByRole("button", { name: "Russian, Native, edit language" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove languages" }));
    fireEvent.click(screen.getByRole("button", { name: "Russian, Native, not selected" }));
    expect(screen.getByRole("button", { name: "Remove 1" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: "Remove languages" }));
    expect(screen.getByRole("button", { name: "Remove 0" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Russian, Native, not selected" }));
    fireEvent.click(screen.getByRole("button", { name: "English, B2, not selected" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove 2" }));
    const dialog = screen.getByRole("dialog", { name: "Remove language" });
    expect(within(dialog).getByText(/Are you sure you want to remove/)).toHaveTextContent("Are you sure you want to remove 2 languages?");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.getByText("No languages here")).toBeVisible());
  });
});
