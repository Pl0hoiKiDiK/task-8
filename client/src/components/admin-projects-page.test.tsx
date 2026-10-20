import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { AdminProjectsPage } from "./admin-projects-page";
import { PROJECTS_QUERY } from "@/lib/cv-api";
import { gql } from "@apollo/client";

const createProject = gql`mutation CreateCatalogProject($project: CreateProjectInput!) {
  createProject(project: $project) { id name domain description environment start_date end_date }
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
});
