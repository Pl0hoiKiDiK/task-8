import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CvPreviewPage } from "./cv-preview-page";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  save: vi.fn(),
  set: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({ mutate: mocks.mutate }),
  useQuery: () => ({ data: { profile: { full_name: "Ada Lovelace" } } }),
}));
vi.mock("@/components/profile-cvs-data", () => ({
  useCvPreviewData: () => ({ cvProjects: {}, cvSkills: {}, cvLanguages: {}, projectCatalog: [] }),
}));
vi.mock("html2pdf.js", () => ({
  default: () => ({ set: mocks.set, from: mocks.from, save: mocks.save }),
}));

afterEach(cleanup);

it("downloads the displayed CV in the browser when server PDF export is unavailable", async () => {
  mocks.mutate.mockReset().mockRejectedValue(new Error("Chromium is unavailable"));
  mocks.save.mockReset().mockResolvedValue(undefined);
  mocks.set.mockReset().mockImplementation(function () { return { from: mocks.from }; });
  mocks.from.mockReset().mockImplementation(function () { return { save: mocks.save }; });

  render(<CvPreviewPage cv={{ id: "1", name: "Frontend CV", education: "University", description: "Summary", employee: "ada@example.com", ownerId: "7" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));

  await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
  expect(mocks.mutate).toHaveBeenCalledOnce();
  expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ filename: "Frontend_CV.pdf" }));
  expect(mocks.from.mock.calls[0][0].textContent).toContain("Ada Lovelace");
  expect(screen.queryByText("Failed to export PDF. Please try again.")).not.toBeInTheDocument();
});
