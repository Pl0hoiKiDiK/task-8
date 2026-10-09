import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdminLanguagesPage } from "./admin-languages-page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin languages page", () => {
  it("creates, edits, and deletes a language through the dialogs", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "new-language" });
    render(<AdminLanguagesPage />);
    await screen.findByText("Беларуская мова");

    fireEvent.click(screen.getByRole("button", { name: "Create language" }));
    const create = screen.getByRole("dialog", { name: "Create language" });
    const name = within(create).getByRole("textbox", { name: "Name" });
    const iso = within(create).getByRole("textbox", { name: "ISO" });
    const nativeName = within(create).getByRole("textbox", { name: "Native name" });
    fireEvent.change(name, { target: { value: "english" } });
    fireEvent.change(iso, { target: { value: "FR" } });
    fireEvent.change(nativeName, { target: { value: "Français" } });
    expect(within(create).getByText("Language already exists")).toBeVisible();
    expect(within(create).getByRole("button", { name: "Create" })).toBeDisabled();

    fireEvent.change(name, { target: { value: "French" } });
    expect(iso).toHaveValue("FR");
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Actions for French" })).toBeVisible());

    fireEvent.click(screen.getByRole("button", { name: "Actions for French" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Edit language" });
    expect(within(edit).getByRole("textbox", { name: "ISO" })).toHaveValue("FR");
    fireEvent.change(within(edit).getByRole("textbox", { name: "Native name" }), { target: { value: "Français de France" } });
    fireEvent.click(within(edit).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Français de France")).toBeVisible());

    fireEvent.click(screen.getByRole("button", { name: "Actions for French" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const deletion = screen.getByRole("dialog", { name: "Delete language" });
    expect(within(deletion).getByText("French")).toBeVisible();
    fireEvent.click(within(deletion).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Actions for French" })).not.toBeInTheDocument());
  });

  it("searches by name and keeps the table header visible for empty results", async () => {
    render(<AdminLanguagesPage />);
    await screen.findByText("Беларуская мова");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search languages by name" }), { target: { value: "not a language" } });
    expect(screen.getByText("No languages found")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Native name" })).toBeVisible();
  });
});
