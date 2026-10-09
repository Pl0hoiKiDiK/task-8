import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdminSkillsPage } from "@/components/admin-skills-page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("admin skills catalog", () => {
  it("keeps specialized columns and dialogs inside the shared catalog", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "graphql-skill" });
    render(<AdminSkillsPage />);
    expect(screen.getByRole("columnheader", { name: "Type" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Category" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Create skill" }));
    const dialog = screen.getByRole("dialog", { name: "Create skill" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Name" }), { target: { value: "GraphQL Client" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Category" }), { target: { value: "Frontend" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Actions for GraphQL Client" })).toBeVisible());
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });
});
