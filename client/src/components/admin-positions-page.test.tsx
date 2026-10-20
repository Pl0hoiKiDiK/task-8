import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { AdminPositionsPage } from "./admin-positions-page";
import { CREATE_POSITION, DELETE_POSITION, POSITIONS_QUERY, UPDATE_POSITION } from "@/lib/catalog-api";

const { reload } = vi.hoisted(() => ({ reload: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/components/profile-cvs-data", () => ({ useCvPreviewData: () => ({ reloadProjectRoles: reload }) }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

describe("admin positions API", () => {
  it("loads positions and keeps the CV role list current after changes", async () => {
    reload.mockClear();
    const mocks = [
      { request: { query: POSITIONS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { positions: { items: [{ id: "1", name: "Frontend Developer" }], total_pages: 1 } } } },
      { request: { query: CREATE_POSITION, variables: { position: { name: "QA Engineer" } } }, result: { data: { createPosition: { id: "2", name: "QA Engineer" } } } },
      { request: { query: UPDATE_POSITION, variables: { position: { positionId: "2", name: "Senior QA Engineer" } } }, result: { data: { updatePosition: { id: "2", name: "Senior QA Engineer" } } } },
      { request: { query: DELETE_POSITION, variables: { position: { positionId: "2" } } }, result: { data: { deletePosition: { affected: 1 } } } },
    ];
    render(<MockedProvider mocks={mocks}><AdminPositionsPage /></MockedProvider>);
    expect(await screen.findByRole("button", { name: "Actions for Frontend Developer" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Create position" }));
    const create = screen.getByRole("dialog", { name: "Create position" });
    fireEvent.change(within(create).getByRole("textbox", { name: "Position" }), { target: { value: "QA Engineer" } });
    fireEvent.click(within(create).getByRole("button", { name: "Create" }));
    fireEvent.click(await screen.findByRole("button", { name: "Actions for QA Engineer" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Edit position" });
    fireEvent.change(within(edit).getByRole("textbox", { name: "Position" }), { target: { value: "Senior QA Engineer" } });
    fireEvent.click(within(edit).getByRole("button", { name: "Save" }));
    fireEvent.click(await screen.findByRole("button", { name: "Actions for Senior QA Engineer" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete position" })).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Actions for Senior QA Engineer" })).not.toBeInTheDocument());
    expect(reload).toHaveBeenCalledTimes(3);
  });
});
