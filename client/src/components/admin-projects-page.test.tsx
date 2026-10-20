import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { AdminProjectsPage } from "./admin-projects-page";
import { PROJECTS_QUERY } from "@/lib/cv-api";
import { gql } from "@apollo/client";

const createProject = gql`mutation CreateCatalogProject($project: CreateProjectInput!) {
  createProject(project: $project) { id name domain description environment start_date end_date }
}`;
const updateProject = gql`mutation UpdateCatalogProject($project: UpdateProjectInput!) {
  updateProject(project: $project) { id name domain description environment start_date end_date }
}`;
const deleteProject = gql`mutation DeleteCatalogProject($project: DeleteProjectInput!) {
  deleteProject(project: $project) { affected }
}`;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

describe("admin projects", () => {
  it("loads real projects, searches by domain and creates a validated project", async () => {
    const mocks = [
      { request: { query: PROJECTS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { projects: { items: [
        { id: "1", name: "Portal", domain: "Finance", description: "Internal portal", environment: ["React"], start_date: "2025-01-01", end_date: "2025-09-01" },
      ], total_pages: 1 } } } },
      { request: { query: createProject, variables: { project: {
        name: "Dashboard", domain: "Analytics", description: "Metrics dashboard",
        environment: ["TypeScript"], start_date: "2025-02-01", end_date: "2025-12-01",
      } } }, result: { data: { createProject: {
        id: "2", name: "Dashboard", domain: "Analytics", description: "Metrics dashboard",
        environment: ["TypeScript"], start_date: "2025-02-01", end_date: "2025-12-01",
      } } } },
    ];
    render(<MockedProvider mocks={mocks}><AdminProjectsPage /></MockedProvider>);
    expect(await screen.findByRole("button", { name: "Actions for Portal" })).toBeVisible();
    expect(screen.getByText("Internal portal")).toBeVisible();
    expect(screen.getByText("React")).toBeVisible();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search projects by name or domain" }), { target: { value: "finance" } });
    expect(screen.getByRole("button", { name: "Actions for Portal" })).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search projects by name or domain" }), { target: { value: "other" } });
    expect(screen.getByText("No projects found")).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search projects by name or domain" }), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Create project" }));
    const dialog = screen.getByRole("dialog", { name: "Create project" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(within(dialog).getByText("Project name is required")).toBeVisible();
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Name" }), { target: { value: "Dashboard" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Domain" }), { target: { value: "Analytics" } });
    fireEvent.change(within(dialog).getByLabelText("Start Date"), { target: { value: "2025-02-01" } });
    fireEvent.change(within(dialog).getByLabelText("End Date"), { target: { value: "2025-12-01" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Description" }), { target: { value: "Metrics dashboard" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Environment" }), { target: { value: "TypeScript" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(within(dialog).getByText("TypeScript")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Actions for Dashboard" })).toBeVisible());
  });

  it("prefills a project, updates its environment and deletes it after confirmation", async () => {
    const original = { id: "1", name: "Portal", domain: "Finance", description: "Internal portal", environment: ["React"], start_date: "2025-01-01", end_date: "2025-09-01" };
    const updated = { ...original, environment: ["TypeScript"] };
    const mocks = [
      { request: { query: PROJECTS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { projects: { items: [original], total_pages: 1 } } } },
      { request: { query: updateProject, variables: { project: { projectId: "1", name: "Portal", domain: "Finance", description: "Internal portal", environment: ["TypeScript"], start_date: "2025-01-01", end_date: "2025-09-01" } } }, result: { data: { updateProject: updated } } },
      { request: { query: deleteProject, variables: { project: { projectId: "1" } } }, result: { data: { deleteProject: { affected: 1 } } } },
    ];
    render(<MockedProvider mocks={mocks}><AdminProjectsPage /></MockedProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Actions for Portal" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Update project" });
    expect(within(edit).getByRole("textbox", { name: "Name" })).toHaveValue("Portal");
    fireEvent.click(within(edit).getByRole("button", { name: "Remove React" }));
    fireEvent.change(within(edit).getByRole("textbox", { name: "Environment" }), { target: { value: "TypeScript" } });
    fireEvent.click(within(edit).getByRole("button", { name: "Add" }));
    fireEvent.click(within(edit).getByRole("button", { name: "Update" }));
    await waitFor(() => expect(screen.getByText("TypeScript")).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Actions for Portal" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("dialog", { name: "Delete project" })).toHaveTextContent("Portal");
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete project" })).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Actions for Portal" })).not.toBeInTheDocument());
  });
});
