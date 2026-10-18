import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store";
import { refreshTokenStorage, sessionStarted } from "@/lib/auth/model/auth-slice";
import { AppShell } from "./app-shell";

const { route, replace, clearStore, accountProfile } = vi.hoisted(() => ({
  route: { current: "/settings" },
  replace: vi.fn(),
  clearStore: vi.fn(),
  accountProfile: { current: { first_name: null as string | null, last_name: null as string | null, avatar: null as string | null } },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => route.current,
  useRouter: () => ({ replace }),
  useSelectedLayoutSegment: () => null,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, onClick, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} onClick={(event) => { event.preventDefault(); onClick?.(event); }}>{children}</a>
  ),
}));
vi.mock("@apollo/client/react", () => ({
  useApolloClient: () => ({ clearStore }),
  useQuery: () => ({ data: { user: { profile: accountProfile.current } } }),
}));

function renderShell() {
  const store = makeStore();
  store.dispatch(sessionStarted({ user: { id: "1", email: "person@example.com", role: "Employee", is_verified: true }, accessToken: "test-token" }));
  return render(<Provider store={store}><AppShell><div>Page content</div></AppShell></Provider>);
}

beforeEach(() => {
  route.current = "/settings";
  replace.mockReset();
  clearStore.mockReset().mockResolvedValue(undefined);
  accountProfile.current = { first_name: null, last_name: null, avatar: null };
  localStorage.clear();
});
afterEach(cleanup);

describe("application navigation", () => {
  it("opens the account menu and closes it outside, on Escape, or after selection", () => {
    renderShell();
    const account = screen.getByRole("button", { name: /person@example.com/ });
    expect(screen.queryByRole("navigation", { name: "Account" })).not.toBeInTheDocument();

    fireEvent.click(account);
    let menu = screen.getByRole("navigation", { name: "Account" });
    expect(menu).toBeVisible();
    expect(within(menu).getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    fireEvent.pointerDown(screen.getByText("Page content"));
    expect(screen.queryByRole("navigation", { name: "Account" })).not.toBeInTheDocument();

    fireEvent.click(account);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Account" })).not.toBeInTheDocument();
    expect(account).toHaveFocus();

    fireEvent.click(account);
    menu = screen.getByRole("navigation", { name: "Account" });
    fireEvent.click(within(menu).getByRole("link", { name: "Profile" }));
    expect(screen.queryByRole("navigation", { name: "Account" })).not.toBeInTheDocument();
  });

  it("shows admin navigation and clears the session on Logout", async () => {
    route.current = "/admin/settings";
    refreshTokenStorage.set("refresh-token");
    renderShell();
    expect(screen.getByRole("link", { name: "Departments" })).toHaveAttribute("href", "/admin/departments");

    fireEvent.click(screen.getByRole("button", { name: /person@example.com/ }));
    const menu = screen.getByRole("navigation", { name: "Account" });
    expect(within(menu).getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/admin/profile");
    fireEvent.click(within(menu).getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/signin"));
    expect(refreshTokenStorage.get()).toBeNull();
    expect(clearStore).toHaveBeenCalled();
  });

  it("shows the profile name when it becomes available", () => {
    accountProfile.current = { first_name: "Jane", last_name: "Doe", avatar: null };
    renderShell();
    expect(screen.getByRole("button", { name: /Jane Doe/ })).toBeVisible();
    expect(screen.getByRole("img", { name: "Jane Doe's initial" })).toHaveTextContent("J");
  });
});
