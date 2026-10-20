import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CvSkillsPage } from "./cv-skills-page";
import type { CvSkill } from "./cv-skills-data";
import type { CvRecord } from "./profile-cvs-data";

const mocks = vi.hoisted(() => ({
  skills: [] as CvSkill[],
  owner: [] as CvSkill[],
  ownerLoaded: true,
  load: vi.fn(), add: vi.fn(), update: vi.fn(), remove: vi.fn(),
}));
const cv: CvRecord = { id: "cv-1", name: "Frontend CV", education: "University", description: "Summary", employee: "ada@example.com", ownerId: "user-1" };

vi.mock("@/components/profile-cvs-data", () => ({
  useCvPreviewData: () => ({
    cvSkills: { "cv-1": mocks.skills }, ownerSkills: mocks.ownerLoaded ? { "user-1": mocks.owner } : {},
    loadOwnerSkills: mocks.load, addCvSkill: mocks.add,
    updateCvSkill: mocks.update, removeCvSkills: mocks.remove,
  }),
}));

beforeEach(() => {
  mocks.skills = [];
  mocks.ownerLoaded = true;
  mocks.owner = [
    { name: "React", category: "Frontend", mastery: "Expert" },
    { name: "TypeScript", category: "Languages", mastery: "Proficient" },
  ];
  for (const fn of [mocks.load, mocks.add, mocks.update, mocks.remove]) fn.mockReset().mockResolvedValue(undefined);
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
});

describe("CV skills", () => {
  it("offers only owner skills not already on the CV and adds the chosen skill", async () => {
    mocks.skills = [{ name: "React", category: "Frontend", mastery: "Expert" }];
    render(<CvSkillsPage cv={cv} />);
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    const dialog = screen.getByRole("dialog", { name: "Add skill" });
    const skill = within(dialog).getByRole("combobox", { name: "Skill" });
    expect(within(skill).queryByRole("option", { name: "React" })).not.toBeInTheDocument();
    expect(within(skill).getByRole("option", { name: "TypeScript" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
    fireEvent.change(skill, { target: { value: "TypeScript" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Skill mastery" }), { target: { value: "Proficient" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mocks.add).toHaveBeenCalledWith("cv-1", "TypeScript", "Proficient"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("preserves the modal and values when adding a skill fails", async () => {
    mocks.add.mockRejectedValueOnce(new Error("API failed"));
    render(<CvSkillsPage cv={cv} />);
    expect(screen.getByText("No skills added yet")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    const dialog = screen.getByRole("dialog", { name: "Add skill" });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Skill" }), { target: { value: "React" } });
    fireEvent.change(within(dialog).getByRole("combobox", { name: "Skill mastery" }), { target: { value: "Expert" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to add skill");
    expect(within(dialog).getByRole("combobox", { name: "Skill" })).toHaveValue("React");
  });

  it("shows a retry action when the CV owner's skills cannot be loaded", async () => {
    mocks.ownerLoaded = false;
    mocks.load.mockRejectedValueOnce(new Error("API failed"));
    render(<CvSkillsPage cv={cv} />);
    expect(screen.getByRole("button", { name: "Add skill" })).toBeDisabled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load available skills");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
  });

  it("updates mastery and removes multiple selected skills", async () => {
    mocks.skills = [
      { name: "React", category: "Frontend", mastery: "Expert" },
      { name: "TypeScript", category: "Languages", mastery: "Proficient" },
    ];
    render(<CvSkillsPage cv={cv} />);
    expect(screen.getByRole("region", { name: "Frontend" })).toHaveTextContent("React");
    fireEvent.click(screen.getByRole("button", { name: "React, Expert, update skill" }));
    const update = screen.getByRole("dialog", { name: "Update skill" });
    expect(within(update).getByRole("combobox", { name: "Skill" })).toBeDisabled();
    fireEvent.change(within(update).getByRole("combobox", { name: "Skill mastery" }), { target: { value: "Advanced" } });
    fireEvent.click(within(update).getByRole("button", { name: "Update" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("cv-1", "React", "Advanced"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Remove skills" }));
    expect(screen.getByRole("button", { name: /Remove 0/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "React, Expert, not selected" }));
    fireEvent.click(screen.getByRole("button", { name: "TypeScript, Proficient, not selected" }));
    fireEvent.click(screen.getByRole("button", { name: /Remove 2/ }));
    expect(screen.getByRole("dialog", { name: "Remove skills" })).toHaveTextContent("2 skills");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("cv-1", ["React", "TypeScript"]));
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove skills" })).toBeInTheDocument());
  });
});
