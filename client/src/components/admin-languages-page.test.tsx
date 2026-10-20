import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { AdminLanguagesPage } from "./admin-languages-page";
import { CREATE_LANGUAGE, DELETE_LANGUAGE, LANGUAGES_QUERY, UPDATE_LANGUAGE } from "@/lib/catalog-api";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

describe("admin languages API", () => {
  it("loads, creates, updates and deletes catalog languages", async () => {
    const mocks = [
      { request: { query: LANGUAGES_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { languages: { items: [{ id: "1", name: "English", iso2: "EN", native_name: "English" }], total_pages: 1 } } } },
      { request: { query: CREATE_LANGUAGE, variables: { language: { name: "German", iso2: "DE", native_name: "Deutsch" } } }, result: { data: { createLanguage: { id: "2", name: "German", iso2: "DE", native_name: "Deutsch" } } } },
      { request: { query: UPDATE_LANGUAGE, variables: { language: { languageId: "2", name: "German", iso2: "DE", native_name: "Deutsch (Germany)" } } }, result: { data: { updateLanguage: { id: "2", name: "German", iso2: "DE", native_name: "Deutsch (Germany)" } } } },
      { request: { query: DELETE_LANGUAGE, variables: { language: { languageId: "2" } } }, result: { data: { deleteLanguage: { affected: 1 } } } },
    ];
    render(<MockedProvider mocks={mocks}><AdminLanguagesPage /></MockedProvider>);
    expect(await screen.findByRole("button", { name: "Actions for English" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Create language" }));
    const create = screen.getByRole("dialog", { name: "Create language" });
    fireEvent.change(within(create).getByRole("textbox", { name: "Name" }), { target: { value: "German" } });
    fireEvent.change(within(create).getByRole("textbox", { name: "ISO" }), { target: { value: "de" } });
    fireEvent.change(within(create).getByRole("textbox", { name: "Native name" }), { target: { value: "Deutsch" } });
    expect(within(create).getByRole("textbox", { name: "ISO" })).toHaveValue("DE");
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    fireEvent.click(await screen.findByRole("button", { name: "Actions for German" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Edit language" });
    fireEvent.change(within(edit).getByRole("textbox", { name: "Native name" }), { target: { value: "Deutsch (Germany)" } });
    fireEvent.click(within(edit).getByRole("button", { name: "Save" }));
    fireEvent.click(await screen.findByRole("button", { name: "Actions for German" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete language" })).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Actions for German" })).not.toBeInTheDocument());
  });
});
