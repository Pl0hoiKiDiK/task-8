import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useQuery } from "@apollo/client/react";
import { useAppSelector } from "@/lib/hooks";
import { EmployeeDetails } from "@/components/employee-details";

vi.mock("@apollo/client/react", () => ({ useQuery: vi.fn() }));
vi.mock("@/lib/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("@/components/my-profile-preview", () => ({ MyProfilePreview: ({ userId }: { userId: string }) => <div>Profile for {userId}</div> }));
vi.mock("@/components/user-skills-preview", () => ({ UserSkillsPreview: ({ canEdit }: { canEdit: boolean }) => <div>Skills {canEdit ? "editable" : "read only"}</div> }));
vi.mock("@/components/user-languages-preview", () => ({ UserLanguagesPreview: ({ canEdit }: { canEdit: boolean }) => <div>Languages {canEdit ? "editable" : "read only"}</div> }));
vi.mock("@/components/profile-cvs-preview", () => ({ ProfileCvsPreview: ({ ownerId }: { ownerId: string }) => <div>CVs for {ownerId}</div> }));
vi.mock("@/components/profile-cvs-data", () => ({ CvPreviewProvider: ({ children, targetUserId, scope }: { children: React.ReactNode; targetUserId: string; scope: string }) => <div data-testid="cv-provider" data-user-id={targetUserId} data-scope={scope}>{children}</div> }));
vi.mock("@/components/profile-languages-data", () => ({ LanguagePreviewProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

const employee = {
  id: "2", email: "jane@example.com", profile: { first_name: "Jane", last_name: "Doe", avatar: null },
  role: "Employee", created_at: "1791212081094", is_verified: true, department: null, position: null,
};

function viewer(id: string, role: "Admin" | "Employee") {
  vi.mocked(useAppSelector).mockImplementation((selector) => selector({ auth: { user: { id, role } } } as never));
}

beforeEach(() => {
  vi.mocked(useQuery).mockReturnValue({ data: { user: employee }, loading: false, error: undefined, refetch: vi.fn() } as never);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("selected employee details", () => {
  it("shows an admin the selected employee's skills and CVs", () => {
    viewer("1", "Admin");
    const { rerender } = render(<EmployeeDetails userId="2" admin section="skills" />);
    expect(screen.getByText("Skills editable")).toBeVisible();
    expect(screen.getByTestId("cv-provider")).toHaveAttribute("data-user-id", "2");
    expect(screen.getByRole("link", { name: "CVs" })).toHaveAttribute("href", "/admin/employees/2?section=cvs");
    rerender(<EmployeeDetails userId="2" admin section="cvs" />);
    expect(screen.getByText("CVs for 2")).toBeVisible();
  });

  it("keeps another employee's skills and languages read only and hides CVs", () => {
    viewer("1", "Employee");
    const { rerender } = render(<EmployeeDetails userId="2" section="skills" />);
    expect(screen.getByText("Skills read only")).toBeVisible();
    expect(screen.queryByRole("link", { name: "CVs" })).not.toBeInTheDocument();
    rerender(<EmployeeDetails userId="2" section="languages" />);
    expect(screen.getByText("Languages read only")).toBeVisible();
    expect(screen.getByTestId("cv-provider")).toHaveAttribute("data-user-id", "2");
  });

  it("allows the profile owner to manage their skills", () => {
    viewer("2", "Employee");
    render(<EmployeeDetails userId="2" section="skills" />);
    expect(screen.getByText("Skills editable")).toBeVisible();
  });
});
