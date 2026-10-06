import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdminPositionsPage } from "./admin-positions-page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin positions page", () => {
  it("creates, edits and deletes a position, with pagination", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "product-manager" });
    render(<AdminPositionsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create position" }));
    const create = screen.getByRole("dialog", { name: "Create position" });
    const input = within(create).getByRole("textbox", { name: "Position" });
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    expect(within(create).getByText("Position name is required")).toBeVisible();
    fireEvent.change(input, { target: { value: "software engineer" } });
    expect(within(create).getByText("Position already exists")).toBeVisible();
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    expect(create).toBeVisible();

    fireEvent.change(input, { target: { value: "Product Manager" } });
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page"));
    expect(screen.getByRole("button", { name: "Actions for Product Manager" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Actions for Product Manager" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Edit position" });
    expect(within(edit).getByRole("textbox", { name: "Position" })).toHaveValue("Product Manager");
    fireEvent.change(within(edit).getByRole("textbox", { name: "Position" }), { target: { value: "  Product Lead  " } });
    fireEvent.click(within(edit).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Actions for Product Lead" })).toBeVisible());

    fireEvent.click(screen.getByRole("button", { name: "Actions for Product Lead" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const deletion = screen.getByRole("dialog", { name: "Delete position" });
    expect(within(deletion).getByText("Product Lead")).toBeVisible();
    fireEvent.click(within(deletion).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Actions for Product Lead" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Page 2" })).not.toBeInTheDocument();
  });

  it("keeps a position assigned to employees and shows a clear error", async () => {
    render(<AdminPositionsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Software Engineer" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const deletion = screen.getByRole("dialog", { name: "Delete position" });
    fireEvent.click(within(deletion).getByRole("button", { name: "Confirm" }));
    expect(await within(deletion).findByRole("alert")).toHaveTextContent("currently in use");
    expect(screen.getByRole("button", { name: "Actions for Software Engineer" })).toBeVisible();
  });

  it("filters across the list and keeps its table heading for empty results", () => {
    render(<AdminPositionsPage />);
    const search = screen.getByRole("searchbox", { name: "Search positions by name" });
    fireEvent.change(search, { target: { value: "aRcHiTeCt" } });
    expect(screen.getByRole("button", { name: "Actions for Data Architect" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Actions for Software Engineer" })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "not a position" } });
    expect(screen.getByText("No positions found")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeVisible();
  });

  it("sorts in both directions and opens only one action menu", () => {
    render(<AdminPositionsPage />);
    const sort = screen.getByRole("button", { name: "Sort by name" });
    fireEvent.click(sort);
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Data Analyst");
    fireEvent.click(sort);
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "descending");
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("UX Designer");
    fireEvent.click(screen.getByRole("button", { name: "Actions for UX Designer" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Systems Analyst" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menu", { name: "Actions for Systems Analyst" })).toBeVisible();
  });
});
