import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdminDepartmentsPage } from "./admin-departments-page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin departments page", () => {
  it("creates, edits and deletes a department, with pagination", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "flutter" });
    render(<AdminDepartmentsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create department" }));
    const create = screen.getByRole("dialog", { name: "Create department" });
    const input = within(create).getByRole("textbox", { name: "Department" });
    fireEvent.change(input, { target: { value: "react" } });
    expect(within(create).getByText("Department already exists")).toBeVisible();
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    expect(create).toBeVisible();

    fireEvent.change(input, { target: { value: "Flutter" } });
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page"));
    expect(screen.getByRole("button", { name: "Actions for Flutter" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Actions for Flutter" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Edit department" });
    expect(within(edit).getByRole("textbox", { name: "Department" })).toHaveValue("Flutter");
    fireEvent.change(within(edit).getByRole("textbox", { name: "Department" }), { target: { value: "  Flutter Team  " } });
    fireEvent.click(within(edit).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Actions for Flutter Team" })).toBeVisible());

    fireEvent.click(screen.getByRole("button", { name: "Actions for Flutter Team" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const deletion = screen.getByRole("dialog", { name: "Delete department" });
    expect(within(deletion).getByText("Flutter Team")).toBeVisible();
    fireEvent.click(within(deletion).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Actions for Flutter Team" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Page 2" })).not.toBeInTheDocument();
  });

  it("keeps a department assigned to employees and shows a clear error", async () => {
    render(<AdminDepartmentsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for React" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const deletion = screen.getByRole("dialog", { name: "Delete department" });
    fireEvent.click(within(deletion).getByRole("button", { name: "Confirm" }));
    expect(await within(deletion).findByRole("alert")).toHaveTextContent("currently in use");
    expect(screen.getByRole("button", { name: "Actions for React" })).toBeVisible();
  });

  it("filters across the list and keeps its table heading for empty results", () => {
    render(<AdminDepartmentsPage />);
    const search = screen.getByRole("searchbox", { name: "Search departments by name" });
    fireEvent.change(search, { target: { value: "quality" } });
    expect(screen.getByRole("button", { name: "Actions for Quality Assurance" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Actions for React" })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "not a department" } });
    expect(screen.getByText("No departments found")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
  });
});
