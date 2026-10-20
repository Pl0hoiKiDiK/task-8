import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ProfileCvsPreview } from "./profile-cvs-preview";
import type { CvRecord } from "./profile-cvs-data";

const mocks = vi.hoisted(() => ({
  cvs: [] as CvRecord[],
  create: vi.fn(), update: vi.fn(), remove: vi.fn(), reload: vi.fn(),
}));
const cv: CvRecord = { id: "cv-1", ownerId: "user-1", name: "Frontend CV", education: "University", description: "Summary", employee: "ada@example.com" };

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/components/profile-cvs-data", () => ({
  useCvPreviewData: () => ({
    cvs: mocks.cvs, currentUserId: "user-1", loadState: "ready", reload: mocks.reload,
    createCv: mocks.create, updateCv: mocks.update, deleteCv: mocks.remove,
  }),
}));

beforeEach(() => {
  mocks.cvs = [cv];
  for (const fn of [mocks.create, mocks.update, mocks.remove, mocks.reload]) fn.mockReset().mockResolvedValue(undefined);
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});

describe("CV list actions", () => {
  it("validates and creates a CV for the selected employee", async () => {
    render(<ProfileCvsPreview view="user" ownerId="user-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Create CV" }));
    const dialog = screen.getByRole("dialog", { name: "Create CV" });
    expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();
    const name = within(dialog).getByRole("textbox", { name: "Name" });
    fireEvent.change(name, { target: { value: " " } });
    fireEvent.blur(name);
    expect(within(dialog).getByText("Name is required")).toBeVisible();
    fireEvent.change(name, { target: { value: "  New CV  " } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Education" }), { target: { value: " University " } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Description" }), { target: { value: " Summary " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ name: "New CV", education: "University", description: "Summary" }, "user-1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps form values on a failed edit, then saves successfully", async () => {
    mocks.update.mockRejectedValueOnce(new Error("API failed"));
    render(<ProfileCvsPreview view="employee" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Frontend CV" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const dialog = screen.getByRole("dialog", { name: "Update CV" });
    const description = within(dialog).getByRole("textbox", { name: "Description" });
    fireEvent.change(description, { target: { value: "Updated summary" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to update CV");
    expect(description).toHaveValue("Updated summary");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("cv-1", { name: "Frontend CV", education: "University", description: "Updated summary" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("requires confirmation before deletion and retains the dialog on failure", async () => {
    mocks.remove.mockRejectedValueOnce(new Error("API failed"));
    render(<ProfileCvsPreview view="admin" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions for Frontend CV" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: "Delete CV" });
    expect(dialog).toHaveTextContent("Frontend CV");
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to delete CV");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
    expect(mocks.remove).toHaveBeenCalledWith("cv-1");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("filters by employee for admin and navigates sorted pages", () => {
    mocks.cvs = Array.from({ length: 7 }, (_, index) => ({ ...cv, id: `cv-${index}`, name: `CV ${index}`, employee: index === 6 ? "special@example.com" : "ada@example.com" }));
    render(<ProfileCvsPreview view="admin" />);
    expect(screen.getAllByRole("article")).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Sort by name/ }));
    expect(screen.getAllByRole("article")).toHaveLength(5);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "SPECIAL@" } });
    expect(screen.getByRole("article", { name: "CV 6" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "CV pages" })).not.toBeInTheDocument();
  });
});
