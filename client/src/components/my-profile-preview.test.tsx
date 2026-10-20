import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MyProfilePreview } from "./my-profile-preview";
import { DEPARTMENTS_QUERY, POSITIONS_QUERY } from "@/lib/catalog-api";
import { DELETE_AVATAR, UPDATE_PROFILE, UPDATE_USER_ASSIGNMENT } from "@/lib/cv-api";
import { SEND_VERIFICATION_MUTATION } from "@/lib/auth/api/graphql";

const mocks = vi.hoisted(() => ({
  query: vi.fn(), mutate: vi.fn(), reload: vi.fn(), refetch: vi.fn(), push: vi.fn(),
  avatar: "https://example.com/avatar.png",
  isVerified: true,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({ query: mocks.query, mutate: mocks.mutate }),
  useQuery: () => ({
    data: { user: { id: "user-1", role: "Employee", department: { id: "d-1", name: "Engineering" }, position: { id: "p-1", name: "Developer" } } },
    loading: false, error: null, refetch: mocks.refetch,
  }),
}));
vi.mock("@/components/profile-cvs-data", () => ({
  useCvPreviewData: () => ({
    currentUserId: "user-1", currentUserEmail: "ada@example.com", loadState: "ready", reload: mocks.reload,
    profile: { id: "user-1", created_at: "2025-01-01", first_name: "Ada", last_name: "Lovelace", full_name: "Ada Lovelace", email: "ada@example.com", avatar: mocks.avatar, is_verified: mocks.isVerified, skills: [], languages: [] },
  }),
}));

beforeEach(() => {
  mocks.avatar = "https://example.com/avatar.png";
  mocks.isVerified = true;
  mocks.push.mockReset();
  mocks.query.mockReset().mockImplementation(async ({ query }) => {
    if (query === DEPARTMENTS_QUERY) return { data: { departments: { items: [{ id: "d-1", name: "Engineering" }, { id: "d-2", name: "Design" }], total_pages: 1 } } };
    if (query === POSITIONS_QUERY) return { data: { positions: { items: [{ id: "p-1", name: "Developer" }], total_pages: 1 } } };
    throw new Error("Unexpected query");
  });
  mocks.mutate.mockReset().mockResolvedValue({ data: {} });
  mocks.reload.mockReset().mockResolvedValue(undefined);
  mocks.refetch.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

it("loads profile catalogs and saves changed identity and department through GraphQL", async () => {
  render(<MyProfilePreview />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading profile");
  const firstName = await screen.findByRole("textbox", { name: "First Name" });
  expect(firstName).toHaveValue("Ada");
  const update = screen.getByRole("button", { name: "Update" });
  expect(update).toBeDisabled();
  fireEvent.change(firstName, { target: { value: "Ada Marie" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Department" }), { target: { value: "d-2" } });
  fireEvent.click(update);
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(2));
  expect(mocks.mutate).toHaveBeenCalledWith({ mutation: UPDATE_PROFILE, variables: { profile: { userId: "user-1", first_name: "Ada Marie", last_name: "Lovelace" } } });
  expect(mocks.mutate).toHaveBeenCalledWith({ mutation: UPDATE_USER_ASSIGNMENT, variables: { user: { userId: "user-1", departmentId: "d-2", positionId: "p-1", role: "Employee" } } });
  expect(await screen.findByRole("status")).toHaveTextContent("Profile updated");
  expect(mocks.refetch).toHaveBeenCalled();
});

it("validates avatar uploads, then removes an existing avatar", async () => {
  render(<MyProfilePreview />);
  const input = await screen.findByLabelText("Choose avatar image");
  fireEvent.change(input, { target: { files: [new File(["not an image"], "notes.txt", { type: "text/plain" })] } });
  expect(screen.getByRole("alert")).toHaveTextContent("Choose a PNG, JPG or GIF image");
  expect(mocks.mutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Remove avatar" }));
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith({ mutation: DELETE_AVATAR, variables: { avatar: { userId: "user-1" } } }));
  expect(await screen.findByRole("status")).toHaveTextContent("Avatar removed");
});

it("renders another user's profile without edit actions", async () => {
  render(<MyProfilePreview canEdit={false} isOwner={false} />);
  expect(await screen.findByRole("textbox", { name: "First Name" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove avatar" })).not.toBeInTheDocument();
});

it("requests a verification email before opening the code page", async () => {
  mocks.isVerified = false;
  render(<MyProfilePreview />);
  fireEvent.click(await screen.findByRole("button", { name: "Verify email" }));
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith({ mutation: SEND_VERIFICATION_MUTATION, variables: { email: "ada@example.com" } }));
  expect(mocks.push).toHaveBeenCalledWith("/verify-email?sent=1");
});

it("keeps the user on the profile if sending verification fails", async () => {
  mocks.isVerified = false;
  mocks.mutate.mockRejectedValueOnce(new Error("Mail unavailable"));
  render(<MyProfilePreview />);
  fireEvent.click(await screen.findByRole("button", { name: "Verify email" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to send verification email");
  expect(mocks.push).not.toHaveBeenCalled();
});
