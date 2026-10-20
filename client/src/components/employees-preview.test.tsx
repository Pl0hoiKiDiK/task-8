import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CombinedGraphQLErrors } from "@apollo/client";
import { EmployeesPreview } from "./employees-preview";

const mocks = vi.hoisted(() => {
  const options = vi.fn();
  const refetchQueries = vi.fn();
  return { query: vi.fn(), mutate: vi.fn(), options, refetch: vi.fn(), refetchQueries, client: { query: options, refetchQueries } };
});

vi.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => mocks.query(...args),
  useMutation: () => [mocks.mutate, { loading: false }],
  useApolloClient: () => mocks.client,
}));

const ada = {
  id: "7", created_at: "2025-01-01T00:00:00.000Z", email: "ada@example.com", role: "Employee", is_verified: true,
  profile: { first_name: "Ada", last_name: "Lovelace", avatar: null },
  department: { id: "1", name: "Engineering" }, position: { id: "2", name: "Developer" },
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

beforeEach(() => {
  mocks.query.mockReturnValue({ data: { users: { items: [ada], total: 1, page: 1, total_pages: 1 } }, loading: false, error: undefined, refetch: mocks.refetch });
  mocks.options.mockResolvedValue({
    data: {
      departments: { items: [{ id: "1", name: "Engineering" }], total_pages: 1 },
      positions: { items: [{ id: "2", name: "Developer" }], total_pages: 1 },
    }
  });
  mocks.mutate.mockResolvedValue({ data: { createUser: { id: "8" } } });
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("employees page", () => {
  it("gives employees a read-only route and sends sorting and search to the API", async () => {
    render(<EmployeesPreview />);
    expect(screen.queryByRole("button", { name: /create user/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Ada Lovelace" })).toHaveAttribute("href", "/employees/7");

    fireEvent.click(screen.getByRole("button", { name: /First Name/ }));
    expect(mocks.query.mock.lastCall?.[1].variables.params).toMatchObject({ sort_by: "first_name", sort_order: "ASC", page: 1 });

    fireEvent.change(screen.getByRole("searchbox", { name: /Search employees/ }), { target: { value: "ADA" } });
    await waitFor(() => expect(mocks.query.mock.lastCall?.[1].variables.params.search).toBe("ADA"));
  });

  it("keeps admin actions in one keyboard-accessible menu", () => {
    render(<EmployeesPreview admin />);
    const trigger = screen.getByRole("button", { name: "Actions for Ada Lovelace" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute("href", "/admin/employees/7");
    expect(screen.getByRole("menuitem", { name: "Update" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("sorts departments across server pages using their names", async () => {
    const later = Array.from({ length: 100 }, (_, index) => ({
      ...ada, id: String(index + 1), email: `person${index}@example.com`,
      profile: { ...ada.profile, first_name: `Person ${index}` },
      department: { id: "2", name: "Zebra" },
    }));
    const first = { ...ada, id: "101", email: "first@example.com", department: { id: "1", name: "Alpha" } };
    const regular = { data: { users: { items: [ada], total: 1, page: 1, total_pages: 1 } }, loading: false, error: undefined, refetch: mocks.refetch };
    const bulk = { data: { users: { items: later, total: 101, page: 1, total_pages: 2 } }, loading: false, error: undefined, refetch: mocks.refetch };
    mocks.query.mockImplementation((_query, options) => options.variables.params.limit === 100 ? bulk : regular);
    mocks.options.mockResolvedValueOnce({ data: { users: { items: [first], total: 101, page: 2, total_pages: 2 } } });

    render(<EmployeesPreview />);
    fireEvent.click(screen.getByRole("button", { name: /Department/ }));
    await waitFor(() => expect(screen.getByRole("link", { name: "View Ada Lovelace" })).toHaveAttribute("href", "/employees/101"));
    expect(screen.getByText("Alpha")).toBeVisible();

    expect(screen.getByRole("button", { name: "Page 2" })).toBeVisible();
  });

  it("validates the create form and sends all required values", async () => {
    render(<EmployeesPreview admin />);
    fireEvent.click(screen.getByRole("button", { name: "Create user" }));
    const dialog = screen.getByRole("dialog", { name: "Create user" });
    const create = within(dialog).getByRole("button", { name: "Create" });
    expect(create).toBeDisabled();
    await waitFor(() => expect(within(dialog).getByRole("combobox", { name: "Department" })).toBeEnabled());

    fireEvent.change(within(dialog).getByRole("textbox", { name: "Email" }), { target: { value: "new@example.com" } });
    fireEvent.change(within(dialog).getByLabelText("Password"), { target: { value: "123456" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "First Name" }), { target: { value: "New" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Last Name" }), { target: { value: "Person" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Department" }), { target: { value: "1" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Position" }), { target: { value: "2" } });
    expect(create).toBeEnabled();
    fireEvent.click(create);
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith({
      variables: {
        user: {
          auth: { email: "new@example.com", password: "123456" },
          profile: { first_name: "New", last_name: "Person" },
          departmentId: "1", positionId: "2", role: "Employee",
        }
      }
    }));
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("uses the existing profile and user mutations for updates", async () => {
    render(<EmployeesPreview admin />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Ada Lovelace" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Update" }));
    const dialog = screen.getByRole("dialog", { name: "Update user" });
    await waitFor(() => expect(within(dialog).getByRole("combobox", { name: "Department" })).toBeEnabled());
    expect(within(dialog).getByRole("textbox", { name: "Email" })).toBeDisabled();
    expect(within(dialog).getByLabelText("Password")).toBeDisabled();
    fireEvent.change(within(dialog).getByRole("textbox", { name: "First Name" }), { target: { value: "Augusta" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Role" }), { target: { value: "Admin" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Update" }));
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(2));
    expect(mocks.mutate.mock.calls[0][0]).toEqual({ variables: { profile: { userId: "7", first_name: "Augusta", last_name: "Lovelace" } } });
    expect(mocks.mutate.mock.calls[1][0]).toEqual({ variables: { user: { userId: "7", departmentId: "1", positionId: "2", role: "Admin" } } });
  });

  it("keeps the delete dialog open when the server forbids deleting a verified user", async () => {
    mocks.mutate.mockRejectedValueOnce(new CombinedGraphQLErrors({ data: null, errors: [{ message: "cannotDeleteVerifiedUser" }] }));
    render(<EmployeesPreview admin />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Ada Lovelace" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete user" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Verified users cannot be deleted");
    expect(dialog).toBeVisible();
  });
  it("shows field names as placeholders inside the inputs, as in the design", async () => {
    render(<EmployeesPreview admin />);
    fireEvent.click(screen.getByRole("button", { name: "Create user" }));
    const dialog = screen.getByRole("dialog", { name: "Create user" });
    for (const name of ["Email", "Password", "First Name", "Last Name"]) expect(within(dialog).getByPlaceholderText(name)).toBeVisible();
    expect(within(dialog).getByRole("combobox", { name: "Role" })).toHaveValue("Employee");
    fireEvent.click(within(dialog).getByRole("button", { name: "Show password" }));
    expect(within(dialog).getByPlaceholderText("Password")).toHaveAttribute("type", "text");
  });

  it("names the user by email in the delete dialog when the profile has no name", async () => {
    mocks.query.mockReturnValue({ data: { users: { items: [{ ...ada, profile: { first_name: null, last_name: null, avatar: null } }], total: 1, page: 1, total_pages: 1 } }, loading: false, error: undefined, refetch: mocks.refetch });
    render(<EmployeesPreview admin />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for ada@example.com" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("dialog", { name: "Delete user" })).toHaveTextContent("delete user ada@example.com?");
  });

  it("after a failed second step keeps the saved name and retries only the remaining mutation", async () => {
    mocks.mutate
      .mockResolvedValueOnce({ data: { updateProfile: { id: "7" } } })
      .mockRejectedValueOnce(new CombinedGraphQLErrors({ data: null, errors: [{ message: "departmentNotFound" }] }))
      .mockResolvedValueOnce({ data: { updateUser: { id: "7" } } });
    render(<EmployeesPreview admin />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Ada Lovelace" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Update" }));
    const dialog = screen.getByRole("dialog", { name: "Update user" });
    await waitFor(() => expect(within(dialog).getByRole("combobox", { name: "Department" })).toBeEnabled());
    fireEvent.change(within(dialog).getByRole("textbox", { name: "First Name" }), { target: { value: "Augusta" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Role" }), { target: { value: "Admin" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Update" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Name was saved, but department, position or role were not: Department not found");
    expect(mocks.refetchQueries).toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Update" }));
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(3));
    expect(mocks.mutate.mock.calls[2][0]).toEqual({ variables: { user: { userId: "7", departmentId: "1", positionId: "2", role: "Admin" } } });
  });

  it("does not loop on total_pages 0 and caps absurd page counts", async () => {
    mocks.options.mockResolvedValue({ data: { departments: { items: [{ id: "1", name: "Engineering" }], total_pages: 0 }, positions: { items: [{ id: "2", name: "Developer" }], total_pages: 0 } } });
    render(<EmployeesPreview admin />);
    fireEvent.click(screen.getByRole("button", { name: "Create user" }));
    await waitFor(() => expect(within(screen.getByRole("dialog", { name: "Create user" })).getByRole("combobox", { name: "Department" })).toBeEnabled());
    expect(mocks.options).toHaveBeenCalledTimes(2);
  });
});
