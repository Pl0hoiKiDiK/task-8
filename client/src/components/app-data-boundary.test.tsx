import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppDataBoundary } from "./app-data-boundary";

const route = vi.hoisted(() => ({ pathname: "/employees" }));

vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/profile-cvs-data", () => ({
  CvPreviewProvider: ({ children, scope }: { children: React.ReactNode; scope: string }) =>
    <div data-testid="cv-data" data-scope={scope}>{children}</div>,
}));
vi.mock("@/components/profile-languages-data", () => ({
  LanguagePreviewProvider: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="language-data">{children}</div>,
}));

afterEach(cleanup);

describe("route data boundary", () => {
  it("keeps employee and admin catalog pages free of CV data loading", () => {
    for (const pathname of ["/employees", "/admin/projects", "/admin/positions"]) {
      route.pathname = pathname;
      const view = render(<AppDataBoundary>Page</AppDataBoundary>);
      expect(screen.getByRole("main")).toHaveTextContent("Page");
      expect(screen.queryByTestId("cv-data")).not.toBeInTheDocument();
      view.unmount();
    }
  });

  it.each([
    ["/cvs", "cvs"],
    ["/admin/cvs/42", "cv-details"],
    ["/cvs/42/skills", "cv-skills"],
    ["/admin/cvs/42/projects", "cv-projects"],
    ["/cvs/42/preview", "cv-preview"],
    ["/profile/skills", "profile-skills"],
  ])("loads only %s data for %s", (pathname, scope) => {
    route.pathname = pathname;
    render(<AppDataBoundary>Page</AppDataBoundary>);
    expect(screen.getByTestId("cv-data")).toHaveAttribute("data-scope", scope);
    expect(screen.queryByTestId("language-data")).not.toBeInTheDocument();
  });

  it("adds language data only for a language page", () => {
    route.pathname = "/profile/languages";
    render(<AppDataBoundary>Page</AppDataBoundary>);
    expect(screen.getByTestId("cv-data")).toHaveAttribute("data-scope", "profile-languages");
    expect(screen.getByTestId("language-data")).toBeInTheDocument();
  });
});
