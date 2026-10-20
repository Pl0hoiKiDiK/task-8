import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { AdminDepartmentsPage } from "./admin-departments-page";
import { CREATE_DEPARTMENT, DELETE_DEPARTMENT, DEPARTMENTS_QUERY, UPDATE_DEPARTMENT } from "@/lib/catalog-api";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

describe("admin departments API", () => {
  it("loads, creates, updates and deletes through GraphQL", async () => {
    const mocks = [
      { request: { query: DEPARTMENTS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { departments: { items: [{ id: "1", name: "React" }], total_pages: 1 } } } },
      { request: { query: CREATE_DEPARTMENT, variables: { department: { name: "Flutter" } } }, result: { data: { createDepartment: { id: "2", name: "Flutter" } } } },
      { request: { query: UPDATE_DEPARTMENT, variables: { department: { departmentId: "2", name: "Flutter Team" } } }, result: { data: { updateDepartment: { id: "2", name: "Flutter Team" } } } },
      { request: { query: DELETE_DEPARTMENT, variables: { department: { departmentId: "2" } } }, result: { data: { deleteDepartment: { affected: 1 } } } },
    ];
    render(<MockedProvider mocks={mocks}><AdminDepartmentsPage /></MockedProvider>);
    expect(await screen.findByRole("button", { name: "Actions for React" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Create department" }));
    const create = screen.getByRole("dialog", { name: "Create department" });
    fireEvent.change(within(create).getByRole("textbox", { name: "Department" }), { target: { value: "Flutter" } });
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    fireEvent.click(await screen.findByRole("button", { name: "Actions for Flutter" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Edit department" });
    fireEvent.change(within(edit).getByRole("textbox", { name: "Department" }), { target: { value: "Flutter Team" } });
    fireEvent.click(within(edit).getByRole("button", { name: "Save" }));
    fireEvent.click(await screen.findByRole("button", { name: "Actions for Flutter Team" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete department" })).getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("button", { name: "Actions for React" })).toBeVisible();
  });
});
