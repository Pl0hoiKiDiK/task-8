import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { makeStore, withStore } from "@/lib/auth/test-utils";

const replace = vi.fn();
const signup = vi.fn();
const mutation = { loading: false };
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@apollo/client/react", () => ({ useMutation: () => [signup, { loading: mutation.loading }] }));
vi.stubGlobal("localStorage", { getItem: () => null, setItem() { }, removeItem() { } });

import SignUpPage from "./page";

const view = () => { const store = makeStore(); render(<SignUpPage />, { wrapper: withStore(store) }); return store; };
const fill = async (confirm = "secret1") => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "a@b.co");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.type(screen.getByLabelText("Confirm password"), confirm);
    return user;
};
const button = () => screen.getByRole("button", { name: /create account|creating/i }) as HTMLButtonElement;

beforeEach(() => { vi.clearAllMocks(); mutation.loading = false; });

describe("SignUpPage", () => {
    it("3 fields, btn disabled, link «I have an account» is able", () => {
        view();
        for (const l of ["Email", "Password", "Confirm password"]) expect(screen.getByLabelText(l)).toBeTruthy();
        expect(button().disabled).toBe(true);
        expect(screen.getByRole("link", { name: "I have an account" }).getAttribute("href")).toBe("/signin");
    });
    it("passwords do not match - btn disabled and error shows at field after blur", async () => {
        view(); const user = await fill("different");
        await user.tab();
        expect(button().disabled).toBe(true);
        expect((await screen.findByRole("alert")).textContent).toBe("Passwords do not match");
    });
    it("success: session in store, redirect to /verify-email", async () => {
        signup.mockResolvedValue({
            data: {
                signup: {
                    access_token: "A", refresh_token: "R", user: { id: "1", email: "a@b.co", role: "Employee", is_verified: false }
                }
            }
        });
        const store = view(); const user = await fill();
        await user.click(button());
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/verify-email"));
        expect(store.getState().auth.user?.is_verified).toBe(false);
    });
    it("email already exists - form error, no redirect", async () => {
        signup.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "userAlreadyExists" }] }));
        view(); const user = await fill();
        await user.click(button());
        expect((await screen.findByRole("alert")).textContent).toBe("An account with this email already exists");
        expect(replace).not.toHaveBeenCalled();
    });
    it("during request: «Creating...» and button is disabled", () => {
        mutation.loading = true;
        view();
        expect(button().textContent).toBe("Creating...");
        expect(button().disabled).toBe(true);
    });
});
