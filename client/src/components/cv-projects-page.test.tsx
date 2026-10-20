import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CvProjectsPage } from "./cv-projects-page";
import type { CvProjectEntry } from "./cv-projects-data";
import type { CvRecord } from "./profile-cvs-data";

const mocks = vi.hoisted(() => ({
  entries: [] as CvProjectEntry[],
  add: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

const cv: CvRecord = { id: "cv-1", name: "Frontend CV", education: "University", description: "Summary", employee: "ada@example.com" };
const catalog = [
  { id: "project-1", name: "Analytics", domain: "Finance", description: "Analytics platform", environment: ["React"], startDate: "2023-01-01", endDate: "2024-12-31" },
  { id: "project-2", name: "Portal", domain: "Healthcare", description: "Patient portal", environment: ["TypeScript"], startDate: "2024-01-01", endDate: null },
];

vi.mock("@/components/profile-cvs-data", () => ({
  useCvPreviewData: () => ({
    cvProjects: { "cv-1": mocks.entries }, projectCatalog: catalog,
    addCvProject: mocks.add, updateCvProject: mocks.update, removeCvProject: mocks.remove,
  }),
}));

beforeEach(() => {
  mocks.entries = [];
  mocks.add.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockResolvedValue(undefined);
  mocks.remove.mockReset().mockResolvedValue(undefined);
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});

describe("CV projects", () => {
  it("fills catalog fields and adds a project with roles and responsibilities", async () => {
    render(<CvProjectsPage cv={cv} />);
    expect(screen.getByRole("status")).toHaveTextContent("No projects added yet");
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    const dialog = screen.getByRole("dialog", { name: "Add project" });
    expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "project-1" } });
    expect(within(dialog).getByLabelText("Domain")).toHaveValue("Finance");
    expect(within(dialog).getByLabelText("Description")).toHaveValue("Analytics platform");
    expect(within(dialog).getByLabelText("Start Date")).toHaveValue("2023-01-01");
    fireEvent.click(within(dialog).getByRole("button", { name: /^Roles/ }));
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Frontend Developer" }));
    fireEvent.change(within(dialog).getByLabelText("Responsibilities"), { target: { value: "Build charts, review code" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mocks.add).toHaveBeenCalledWith("cv-1", {
      projectId: "project-1", startDate: "2023-01-01", endDate: "2024-12-31",
      roles: ["Frontend Developer"], responsibilities: ["Build charts", "review code"],
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("retains entered values after a failed request and validates participation dates", async () => {
    mocks.add.mockRejectedValueOnce(new Error("API failed"));
    render(<CvProjectsPage cv={cv} />);
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    const dialog = screen.getByRole("dialog", { name: "Add project" });
    fireEvent.change(within(dialog).getByLabelText("Name"), { target: { value: "project-1" } });
    fireEvent.change(within(dialog).getByLabelText("Start Date"), { target: { value: "2022-12-31" } });
    fireEvent.blur(within(dialog).getByLabelText("Start Date"));
    expect(within(dialog).getByText("Start date must be within project duration")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Start Date"), { target: { value: "2023-01-01" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Roles/ }));
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Frontend Developer" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to add project");
    expect(within(dialog).getByLabelText("Name")).toHaveValue("project-1");
  });

  it("shows responsibilities, searches by domain, updates and removes an assigned project", async () => {
    mocks.entries = [
      { projectId: "project-1", startDate: "2023-01-01", endDate: "2024-06-30", roles: ["Frontend Developer"], responsibilities: ["Build charts"] },
      { projectId: "project-2", startDate: "2024-01-01", endDate: "", roles: ["Backend Developer"], responsibilities: [] },
    ];
    render(<CvProjectsPage cv={cv} />);
    expect(screen.getByRole("columnheader", { name: "Responsibilities" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "Build charts" })).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "HEALTHCARE" } });
    expect(screen.getByText("Portal")).toBeVisible();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Actions for Analytics" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Update" }));
    const update = screen.getByRole("dialog", { name: "Update project" });
    expect(within(update).getByLabelText("Name")).toBeDisabled();
    expect(within(update).getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.change(within(update).getByLabelText("Responsibilities"), { target: { value: "Build charts, mentor" } });
    fireEvent.click(within(update).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("cv-1", expect.objectContaining({ projectId: "project-1", responsibilities: ["Build charts", "mentor"] })));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Actions for Analytics" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("dialog", { name: "Remove CV project" })).toHaveTextContent("Analytics");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("cv-1", "project-1"));
  });
});
