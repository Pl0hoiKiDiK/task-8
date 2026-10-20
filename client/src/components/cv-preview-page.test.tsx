import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CvPreviewPage } from "./cv-preview-page";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  save: vi.fn(),
  set: vi.fn(),
  from: vi.fn(),
  reload: vi.fn(),
  refetch: vi.fn(),
  previewState: "ready",
  queryError: null as Error | null,
}));

vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({ mutate: mocks.mutate }),
  useQuery: () => ({ data: { profile: { full_name: "Ada Lovelace" } }, error: mocks.queryError, refetch: mocks.refetch }),
}));
vi.mock("@/components/profile-cvs-data", () => ({
  useCvPreviewData: () => ({
    cvProjects: { "1": [{ projectId: "project-1", startDate: "2023-01-01", endDate: "", roles: ["Frontend Developer"], responsibilities: ["Built the interface"] }] },
    cvSkills: { "1": [{ name: "React", category: "Frontend", mastery: "Expert" }] },
    cvLanguages: { "1": [{ name: "English", proficiency: "C1" }] },
    projectCatalog: [{ id: "project-1", name: "Portal", domain: "Finance", description: "Customer portal", environment: ["React"], startDate: "2023-01-01", endDate: null }],
    loadState: mocks.previewState, reload: mocks.reload,
  }),
}));
vi.mock("html2pdf.js", () => ({
  default: () => ({ set: mocks.set, from: mocks.from, save: mocks.save }),
}));

afterEach(cleanup);
beforeEach(() => {
  mocks.previewState = "ready";
  mocks.queryError = null;
  mocks.reload.mockReset().mockResolvedValue(undefined);
  mocks.refetch.mockReset().mockResolvedValue(undefined);
});

const cv = { id: "1", name: "Frontend CV", education: "University", description: "Summary", employee: "ada@example.com", ownerId: "7" };

it("downloads the displayed CV in the browser when server PDF export is unavailable", async () => {
  mocks.mutate.mockReset().mockRejectedValue(new Error("Chromium is unavailable"));
  mocks.save.mockReset().mockResolvedValue(undefined);
  mocks.set.mockReset().mockImplementation(function () { return { from: mocks.from }; });
  mocks.from.mockReset().mockImplementation(function () { return { save: mocks.save }; });

  render(<CvPreviewPage cv={cv} />);
  fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));

  await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
  expect(mocks.mutate).toHaveBeenCalledOnce();
  expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ filename: "Frontend_CV.pdf" }));
  expect(mocks.from.mock.calls[0][0].textContent).toContain("Ada Lovelace");
  expect(screen.queryByText("Failed to export PDF. Please try again.")).not.toBeInTheDocument();
});

it("shows CV-specific projects, languages and skill experience", () => {
  render(<CvPreviewPage cv={cv} />);
  expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeVisible();
  expect(screen.getByText("English C1")).toBeVisible();
  expect(screen.getByText("Finance")).toBeVisible();
  expect(screen.getByText("Customer portal")).toBeVisible();
  expect(screen.getByText("Frontend Developer")).toBeVisible();
  expect(screen.getByText("Built the interface")).toBeVisible();
  expect(screen.getByRole("table")).toHaveTextContent("React");
});

it("downloads the PDF returned by the backend without using the browser fallback", async () => {
  mocks.mutate.mockReset().mockResolvedValue({ data: { exportPdf: btoa("PDF bytes") } });
  mocks.save.mockReset();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const createObjectURL = vi.fn(() => "blob:cv-preview");
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  try {
    render(<CvPreviewPage cv={cv} />);
    fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ variables: { pdf: { html: expect.stringContaining("Ada Lovelace") } } }));
    expect(mocks.save).not.toHaveBeenCalled();
  } finally {
    click.mockRestore();
    if (originalCreate) Object.defineProperty(URL, "createObjectURL", { configurable: true, value: originalCreate });
    else Reflect.deleteProperty(URL, "createObjectURL");
    if (originalRevoke) Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: originalRevoke });
    else Reflect.deleteProperty(URL, "revokeObjectURL");
  }
});

it("prevents export while preview data is unavailable and retries a failed request", () => {
  mocks.previewState = "loading";
  const view = render(<CvPreviewPage cv={cv} />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading CV preview");
  expect(screen.queryByRole("button", { name: "Export PDF" })).not.toBeInTheDocument();
  mocks.previewState = "error";
  view.rerender(<CvPreviewPage cv={cv} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Failed to load CV preview");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(mocks.reload).toHaveBeenCalledOnce();
});
