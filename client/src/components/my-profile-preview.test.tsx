import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useAppSelector } from "@/lib/hooks";
import { MyProfilePreview } from "@/components/my-profile-preview";
import { UPDATE_PROFILE_MUTATION, UPDATE_PROFILE_USER_MUTATION, PROFILE_DEPARTMENTS_QUERY, PROFILE_POSITIONS_QUERY, type ProfileUser } from "@/lib/profile/api";

vi.mock("@apollo/client/react", () => ({ useApolloClient: vi.fn(), useMutation: vi.fn(), useQuery: vi.fn() }));
vi.mock("@/lib/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const profile: ProfileUser = {
  id: "2", email: "person@example.com", created_at: "1791212081094", is_verified: false, role: "Employee",
  profile: { first_name: "Jane", last_name: "Doe", avatar: null },
  department: { id: "d1", name: "React" }, position: { id: "p1", name: "Engineer" },
};
const updateProfile = vi.fn();
const updateUser = vi.fn();
const clientQuery = vi.fn();

beforeEach(() => {
  vi.mocked(useAppSelector).mockImplementation((selector) => selector({ auth: { user: { id: "2", email: profile.email, role: "Employee", is_verified: false } } } as never));
  vi.mocked(useQuery).mockReturnValue({ data: { user: profile }, loading: false, error: undefined, refetch: vi.fn().mockResolvedValue({ data: { user: profile } }) } as never);
  vi.mocked(useApolloClient).mockReturnValue({ query: clientQuery } as never);
  clientQuery.mockImplementation(({ query }) => Promise.resolve({ data: query === PROFILE_DEPARTMENTS_QUERY
    ? { departments: { items: [{ id: "d1", name: "React" }, { id: "d2", name: "DevOps" }], total_pages: 1 } }
    : { positions: { items: [{ id: "p1", name: "Engineer" }], total_pages: 1 } } }));
  updateProfile.mockResolvedValue({ data: { updateProfile: { id: "2" } } });
  updateUser.mockResolvedValue({ data: { updateUser: { id: "2" } } });
  vi.mocked(useMutation).mockImplementation(((document: unknown) => [document === UPDATE_PROFILE_MUTATION ? updateProfile : document === UPDATE_PROFILE_USER_MUTATION ? updateUser : vi.fn(), {}]) as never);
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("My Profile", () => {
  it("lets the owner update changed fields after validation", async () => {
    render(<MyProfilePreview />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Department" })).toBeEnabled());
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "First Name" }), { target: { value: "" } });
    expect(screen.getByText("First name is required")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "First Name" }), { target: { value: "Janet" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Department" }), { target: { value: "d2" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ variables: { profile: { userId: "2", first_name: "Janet", last_name: "Doe" } } }));
    expect(updateUser).toHaveBeenCalledWith({ variables: { user: { userId: "2", departmentId: "d2", positionId: "p1", role: "Employee" } } });
  });

  it("keeps a colleague's profile read-only for an employee", () => {
    vi.mocked(useAppSelector).mockImplementation((selector) => selector({ auth: { user: { id: "1", email: "viewer@example.com", role: "Employee", is_verified: true } } } as never));
    render(<MyProfilePreview userId="2" />);
    expect(screen.getByRole("textbox", { name: "First Name" })).toHaveAttribute("readonly");
    expect(screen.getByRole("combobox", { name: "Department" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload avatar image" })).not.toBeInTheDocument();
  });

  it("preserves edited values when the update request fails", async () => {
    updateProfile.mockRejectedValueOnce(new Error("Network failed"));
    render(<MyProfilePreview />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Department" })).toBeEnabled());
    fireEvent.change(screen.getByRole("textbox", { name: "First Name" }), { target: { value: "Janet" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(screen.getByText(/Could not update the profile/)).toBeVisible());
    expect(screen.getByRole("textbox", { name: "First Name" })).toHaveValue("Janet");
  });

  it("accepts zero catalog pages without requesting another page", async () => {
    clientQuery.mockImplementation(({ query }) => Promise.resolve({ data: query === PROFILE_DEPARTMENTS_QUERY
      ? { departments: { items: [], total_pages: 0 } } : { positions: { items: [], total_pages: 0 } } }));
    render(<MyProfilePreview />);
    await waitFor(() => expect(screen.getByText(/No departments or positions are available yet/)).toBeVisible());
    expect(clientQuery).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid catalog page counts instead of continuing requests", async () => {
    clientQuery.mockImplementation(({ query }) => Promise.resolve({ data: query === PROFILE_DEPARTMENTS_QUERY
      ? { departments: { items: [], total_pages: Number.POSITIVE_INFINITY } } : { positions: { items: [], total_pages: 1 } } }));
    render(<MyProfilePreview />);
    await waitFor(() => expect(screen.getByText(/Could not load departments and positions/)).toBeVisible());
    expect(clientQuery).toHaveBeenCalledTimes(2);
  });

  it("loads all department pages without requesting extra position pages", async () => {
    clientQuery.mockImplementation(({ query, variables }) => Promise.resolve({ data: query === PROFILE_DEPARTMENTS_QUERY
      ? { departments: { items: variables.page === 1 ? [{ id: "d1", name: "React" }] : [{ id: "d2", name: "DevOps" }], total_pages: 2 } }
      : { positions: { items: [{ id: "p1", name: "Engineer" }], total_pages: 1 } } }));
    render(<MyProfilePreview />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Department" })).toBeEnabled());
    expect(screen.getByRole("option", { name: "DevOps" })).toBeInTheDocument();
    expect(clientQuery.mock.calls.map(([request]) => [request.query, request.variables.page])).toEqual([
      [PROFILE_DEPARTMENTS_QUERY, 1], [PROFILE_POSITIONS_QUERY, 1], [PROFILE_DEPARTMENTS_QUERY, 2],
    ]);
  });

  it("rolls back the name when updating department fails", async () => {
    updateUser.mockRejectedValueOnce(new Error("Network failed"));
    render(<MyProfilePreview />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Department" })).toBeEnabled());
    fireEvent.change(screen.getByRole("textbox", { name: "First Name" }), { target: { value: "Janet" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Department" }), { target: { value: "d2" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(2));
    expect(updateProfile).toHaveBeenNthCalledWith(2, { variables: { profile: { userId: "2", first_name: "Jane", last_name: "Doe" } } });
    expect(screen.getByText(/Could not update the profile/)).toBeVisible();
    expect(screen.getByRole("textbox", { name: "First Name" })).toHaveValue("Janet");
  });

  it("reports a partial update if rollback also fails", async () => {
    updateUser.mockRejectedValueOnce(new Error("Network failed"));
    updateProfile.mockResolvedValueOnce({ data: { updateProfile: { id: "2" } } }).mockRejectedValueOnce(new Error("Rollback failed"));
    render(<MyProfilePreview />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Department" })).toBeEnabled());
    fireEvent.change(screen.getByRole("textbox", { name: "First Name" }), { target: { value: "Janet" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Department" }), { target: { value: "d2" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(screen.getByText(/Profile was partially updated/)).toBeVisible());
    expect(screen.getByRole("textbox", { name: "First Name" })).toHaveValue("Janet");
  });

  it("allows an admin to edit another user's profile without offering email verification", async () => {
    vi.mocked(useAppSelector).mockImplementation((selector) => selector({ auth: { user: { id: "1", email: "admin@example.com", role: "Admin", is_verified: true } } } as never));
    render(<MyProfilePreview userId="2" />);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Department" })).toBeEnabled());
    expect(screen.getByRole("textbox", { name: "First Name" })).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Upload avatar image" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
  });
});
