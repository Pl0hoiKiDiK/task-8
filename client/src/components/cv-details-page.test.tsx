import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CvDetailsPage } from "./cv-details-page";

const mocks = vi.hoisted(() => ({
  loadCv: vi.fn(),
  updateCv: vi.fn(),
  cvs: [{ id: "cv-1", name: "Frontend CV", education: "University", description: "Summary", employee: "ada@example.com", ownerId: "user-1" }],
}));

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/components/profile-cvs-data", () => ({
  useCvPreviewData: () => ({ cvs: mocks.cvs, currentUserId: "user-1", loadCv: mocks.loadCv, updateCv: mocks.updateCv }),
}));

beforeEach(() => {
  mocks.loadCv.mockReset().mockResolvedValue(undefined);
  mocks.updateCv.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("CV details", () => {
  it("loads details, validates required fields, and saves changed values", async () => {
    render(<CvDetailsPage cvId="cv-1" role="employee" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading CV details");
    await screen.findByRole("region", { name: "CV details" });
    expect(screen.getByRole("link", { name: "Preview" })).toHaveAttribute("href", "/cvs/cv-1/preview");
    const name = screen.getByRole("textbox", { name: "Name" });
    const update = screen.getByRole("button", { name: "Update" });
    expect(update).toBeDisabled();

    fireEvent.change(name, { target: { value: "" } });
    fireEvent.blur(name);
    expect(screen.getByText("Name is required")).toBeVisible();
    expect(update).toBeDisabled();

    fireEvent.change(name, { target: { value: "  Updated CV  " } });
    fireEvent.click(update);
    await waitFor(() => expect(mocks.updateCv).toHaveBeenCalledWith("cv-1", { name: "Updated CV", education: "University", description: "Summary" }));
    await waitFor(() => expect(update).toBeDisabled());
  });

  it("keeps entered values and exposes an error when save fails", async () => {
    mocks.updateCv.mockRejectedValueOnce(new Error("API error"));
    render(<CvDetailsPage cvId="cv-1" role="admin" />);
    await screen.findByRole("region", { name: "CV details" });
    const description = screen.getByRole("textbox", { name: "Description" });
    fireEvent.change(description, { target: { value: "Updated summary" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to update CV");
    expect(description).toHaveValue("Updated summary");
  });

  it("shows retry when the detailed request fails even if the list has a CV summary", async () => {
    mocks.loadCv.mockRejectedValueOnce(new Error("API error")).mockResolvedValueOnce(undefined);
    render(<CvDetailsPage cvId="cv-1" role="admin" />);
    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Failed to load CV details");
    expect(screen.queryByRole("textbox", { name: "Name" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByRole("region", { name: "CV details" });
    expect(mocks.loadCv).toHaveBeenCalledTimes(2);
  });

  it("does not render another employee's CV", async () => {
    render(<CvDetailsPage cvId="cv-other" role="employee" />);
    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Failed to load CV details");
    expect(screen.getByRole("link", { name: "Back to CVs" })).toHaveAttribute("href", "/cvs");
  });
});
