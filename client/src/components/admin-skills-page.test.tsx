import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { CREATE_SKILL, DELETE_SKILL, SKILL_CATEGORIES_QUERY, SKILLS_QUERY, UPDATE_SKILL } from "@/lib/catalog-api";
import { AdminSkillsPage } from "@/components/admin-skills-page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

describe("admin skills API", () => {
  it("loads categories and sends their IDs when creating a skill", async () => {
    const category = { id: "cat-1", name: "Frontend", parent: { name: "Engineering" } };
    const mocks = [
      { request: { query: SKILL_CATEGORIES_QUERY }, result: { data: { skillCategories: [category] } } },
      { request: { query: SKILLS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { skills: { items: [], total_pages: 0 } } } },
      { request: { query: CREATE_SKILL, variables: { skill: { name: "React", categoryId: "cat-1" } } }, result: { data: { createSkill: { id: "skill-1", name: "React", category } } } },
    ];
    render(<MockedProvider mocks={mocks}><AdminSkillsPage /></MockedProvider>);
    expect(await screen.findByText("No skills found")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Create skill" }));
    const dialog = screen.getByRole("dialog", { name: "Create skill" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Name" }), { target: { value: "React" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Category" }), { target: { value: "Frontend" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("button", { name: "Actions for React" })).toBeVisible();
    expect(screen.getByText("Engineering")).toBeVisible();
  });

  it("updates a catalog skill and confirms its deletion", async () => {
    const category = { id: "cat-1", name: "Frontend", parent: { name: "Engineering" } };
    const original = { id: "skill-1", name: "React", category };
    const updated = { ...original, name: "React.js" };
    const mocks = [
      { request: { query: SKILL_CATEGORIES_QUERY }, result: { data: { skillCategories: [category] } } },
      { request: { query: SKILLS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { skills: { items: [original], total_pages: 1 } } } },
      { request: { query: UPDATE_SKILL, variables: { skill: { skillId: "skill-1", name: "React.js", categoryId: "cat-1" } } }, result: { data: { updateSkill: updated } } },
      { request: { query: DELETE_SKILL, variables: { skill: { skillId: "skill-1" } } }, result: { data: { deleteSkill: { affected: 1 } } } },
    ];
    render(<MockedProvider mocks={mocks}><AdminSkillsPage /></MockedProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Actions for React" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const edit = screen.getByRole("dialog", { name: "Update skill" });
    expect(within(edit).getByRole("combobox", { name: "Category" })).toHaveValue("Frontend");
    fireEvent.change(within(edit).getByRole("textbox", { name: "Name" }), { target: { value: "React.js" } });
    fireEvent.click(within(edit).getByRole("button", { name: "Update" }));
    fireEvent.click(await screen.findByRole("button", { name: "Actions for React.js" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.getByRole("dialog", { name: "Delete skill" })).toHaveTextContent("React.js");
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete skill" })).getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("No skills found")).toBeVisible();
  });
});
