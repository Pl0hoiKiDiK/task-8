import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LanguagePreviewProvider } from "@/components/profile-languages-data";
import { UserLanguagesPreview } from "@/components/user-languages-preview";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(cleanup);

function renderPage() {
  return render(<LanguagePreviewProvider><UserLanguagesPreview /></LanguagePreviewProvider>);
}

describe("personal languages", () => {
  it("blocks duplicates, then adds a language and updates only its proficiency", async () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Russian, Native, edit language" })).toHaveTextContent(/^Russian$/);
    fireEvent.click(screen.getByRole("button", { name: "Add language" }));
    const dialog = screen.getByRole("dialog", { name: "Add language" });
    const name = within(dialog).getByRole("combobox", { name: /^Language$/ });
    const proficiency = within(dialog).getByRole("combobox", { name: "Language proficiency" });

    expect(within(dialog).getByRole("button", { name: /^Add$/ })).toBeDisabled();
    fireEvent.change(name, { target: { value: "English" } });
    fireEvent.change(proficiency, { target: { value: "B1" } });
    expect(within(dialog).getByText("Language already exists")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: /^Add$/ })).toBeDisabled();

    fireEvent.change(name, { target: { value: "German" } });
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
    renderPage();
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
    expect(dialog.querySelector(".profile-cv-dialog-message")).toHaveTextContent("Are you sure you want to remove 2 languages?");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.getByText("No languages here")).toBeVisible());
  });
});
