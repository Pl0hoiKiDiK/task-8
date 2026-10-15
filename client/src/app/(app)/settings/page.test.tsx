import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeSync } from "@/components/theme-sync";
import { makeStore } from "@/lib/store";
import SettingsPage from "./page";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@apollo/client/react", () => ({ useMutation: () => [mutate, { loading: false }] }));

function renderSettings() {
  return render(<Provider store={makeStore()}><ThemeSync /><SettingsPage /></Provider>);
}

function fillValidPasswords() {
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "old-secret" } });
  fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "new-secret" } });
  fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "new-secret" } });
}

beforeEach(() => {
  localStorage.clear();
  mutate.mockReset();
});
afterEach(cleanup);

describe("Settings", () => {
  it("enables CHANGE only for valid passwords and sends the existing mutation", async () => {
    mutate.mockResolvedValue({ data: { changePassword: { id: "user-1" } } });
    renderSettings();

    const submit = screen.getByRole("button", { name: "Change" });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "old-secret" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "new-secret" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "other-secret" } });
    fireEvent.blur(screen.getByLabelText("Confirm Password"));
    expect(screen.getByText("Passwords do not match")).toBeVisible();
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "new-secret" } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() => expect(mutate).toHaveBeenCalledWith({ variables: { args: {
      oldPassword: "old-secret", newPassword: "new-secret", confirmPassword: "new-secret",
    } } }));
    expect(await screen.findByRole("status")).toHaveTextContent("Password changed successfully.");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("shows a server error under the field and keeps entered values", async () => {
    mutate.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "oldPasswordIncorrect" }] }));
    renderSettings();
    fillValidPasswords();
    fireEvent.click(screen.getByRole("button", { name: "Change" }));

    expect(await screen.findByText("Current password is incorrect")).toBeVisible();
    expect(screen.getByLabelText("Password")).toHaveValue("old-secret");
    expect(screen.getByLabelText("New Password")).toHaveValue("new-secret");
  });

  it("restores language choice and lets each password visibility toggle work independently", async () => {
    localStorage.setItem("cv-builder-language", "Spanish");
    renderSettings();
    const language = screen.getByLabelText("Language");
    await waitFor(() => expect(language).toHaveValue("Spanish"));
    expect(screen.getAllByRole("option", { name: /English|French|German|Italian|Polish|Portuguese|Russian|Spanish|Ukrainian/ })).toHaveLength(9);
    fireEvent.change(language, { target: { value: "French" } });
    await waitFor(() => expect(localStorage.getItem("cv-builder-language")).toBe("French"));

    const current = screen.getByLabelText("Password") as HTMLInputElement;
    const next = screen.getByLabelText("New Password") as HTMLInputElement;
    expect(current.type).toBe("password");
    expect(next.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(current.type).toBe("text");
    expect(next.type).toBe("password");
  });
});
