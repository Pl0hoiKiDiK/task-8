import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { makeStore, withStore } from "@/lib/auth/test-utils";

const replace = vi.fn();
const login = vi.fn();
const mutation = { loading: false };
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@apollo/client/react", () => ({ useMutation: () => [login, { loading: mutation.loading }] }));
vi.stubGlobal("localStorage", { getItem: () => null, setItem() { }, removeItem() { } });

import SignInPage from "./page";

const authResult = (role: "Employee" | "Admin") => ({
    access_token: "A", refresh_token: "R", user: { id: "1", email: "a@b.co", role, is_verified: true },
});
const view = () => { const store = makeStore(); render(<SignInPage />, { wrapper: withStore(store) }); return store; };
const fill = async (email = "a@b.co", password = "secret1") => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), email);
    await user.type(screen.getByLabelText("Password"), password);
    return user;
};
const button = () => screen.getByRole("button", { name: /sign in|signing in/i }) as HTMLButtonElement;

beforeEach(() => { vi.clearAllMocks(); mutation.loading = false; });

describe("SignInPage", () => {
    it("empty form: btn disabled, link «Forgot password?» is able", () => {
        view();
        expect(button().disabled).toBe(true);
        expect(screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href")).toBe("/forgot-password");
    });
    it("valid data includes the submit button", async () => {
        view(); await fill();
        expect(button().disabled).toBe(false);
    });
    it("after leaving the field with an invalid email, an error appears", async () => {
        view();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText("Email"), "bad");
        await user.tab();
        expect((await screen.findAllByRole("alert"))[0].textContent).toBe("Please enter a valid email address");
    });
    it("Employee login → session in store, redirect to /employees", async () => {
        login.mockResolvedValue({ data: { login: authResult("Employee") } });
        const store = view(); const user = await fill();
        await user.click(button());
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/employees"));
        expect(store.getState().auth.user?.role).toBe("Employee");
    });
    it("Admin login → redirect to /admin/employees", async () => {
        login.mockResolvedValue({ data: { login: authResult("Admin") } });
        view(); const user = await fill();
        await user.click(button());
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/employees"));
    });
    it("invalid password: error in alert, no redirect, input clears error", async () => {
        login.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "invalidCredentials" }] }));
        view(); const user = await fill();
        await user.click(button());
        expect((await screen.findByRole("alert")).textContent).toBe("Invalid email or password");
        expect(replace).not.toHaveBeenCalled();
        await user.type(screen.getByLabelText("Password"), "x");
        expect(screen.queryByRole("alert")).toBeNull();
    });
    it("during request: text «Signing in...» and button is disabled", async () => {
        mutation.loading = true;
        view();
        expect(button().textContent).toBe("Signing in...");
        expect(button().disabled).toBe(true);
    });
});