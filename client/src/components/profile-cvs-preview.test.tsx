import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CvPreviewProvider, sidebarCvs } from "@/components/profile-cvs-data";
import { ProfileCvsPreview } from "@/components/profile-cvs-preview";

afterEach(cleanup);

describe("CV links", () => {
  it.each([
    ["profile", "/admin/profile/cvs/preview-cv-1"],
    ["admin", "/admin/cvs/preview-cv-1"],
    ["employee", "/cvs/preview-cv-1"],
  ] as const)("opens a CV from the %s view", (view, href) => {
    render(<CvPreviewProvider initialRecords={sidebarCvs}><ProfileCvsPreview view={view} /></CvPreviewProvider>);
    fireEvent.click(screen.getAllByRole("button", { name: "Actions for Software Engineer with 5+ years of experience" })[0]);
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute("href", href);
  });
});
