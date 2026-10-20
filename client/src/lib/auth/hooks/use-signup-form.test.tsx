import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { makeStore, withStore } from "../test-utils";

const replace = vi.fn();
const signup = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@apollo/client/react", () => ({ useMutation: () => [signup, { loading: false }] }));

import { useSignupForm } from "./use-signup-form";

const auth = { access_token: "A", refresh_token: "R", user: { id: "1", email: "a@b.co", role: "Employee", is_verified: false } };
const gql = (m: string) => new CombinedGraphQLErrors({ data: null, errors: [{ message: m }] });

function setup() {
    const store = makeStore();
    const hook = renderHook(() => useSignupForm(), { wrapper: withStore(store) });
    const type = (name: string, value: string) => act(() => hook.result.current.handleChange({ target: { name, value } } as never));
    const fillValid = () => { type("email", " a@b.co "); type("password", "secret1"); type("confirmPassword", "secret1"); };
    const submit = () => act(async () => { await hook.result.current.handleSubmit({ preventDefault() { } } as never); });
    return { store, hook, type, fillValid, submit };
}
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("localStorage", { getItem: () => null, setItem() { }, removeItem() { } }); });

describe("useSignupForm", () => {
    it("success: email trimmed, session saved, redirect to /verify-email", async () => {
        signup.mockResolvedValue({ data: { signup: auth } });
        const { store, fillValid, submit } = setup();
        fillValid(); await submit();
        expect(signup).toHaveBeenCalledWith({ variables: { auth: { email: "a@b.co", password: "secret1", confirmPassword: "secret1" } } });
        expect(store.getState().auth.user?.email).toBe("a@b.co");
        expect(replace).toHaveBeenCalledWith("/verify-email");
    });
    it.each([
        ["userAlreadyExists", "An account with this email already exists"],
        ["failedToSendEmail", "Account created, but we could not send the confirmation email."],
        ["somethingNew", "Something went wrong. Please try again."],
    ])("server error %s → understandable message, no redirect", async (code, text) => {
        signup.mockRejectedValue(gql(code));
        const { hook, fillValid, submit } = setup();
        fillValid(); await submit();
        expect(hook.result.current.formError).toBe(text);
        expect(replace).not.toHaveBeenCalled();
    });
    it("empty (data: null) - form error, not a crash", async () => {
        signup.mockResolvedValue({ data: null });
        const { hook, fillValid, submit } = setup();
        fillValid(); await submit();
        expect(hook.result.current.formError).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });
    it("passwords don't match: canSubmit=false, request not sent, error visible after blur", async () => {
        const { hook, type, submit } = setup();
        type("email", "a@b.co"); type("password", "secret1"); type("confirmPassword", "secret2");
        expect(hook.result.current.canSubmit).toBe(false);
        act(() => hook.result.current.handleBlur({ target: { name: "confirmPassword" } } as never));
        expect(hook.result.current.errors.confirmPassword).toBe("Passwords do not match");
        await submit();
        expect(signup).not.toHaveBeenCalled();
    });
    it("input clears formError", async () => {
        signup.mockRejectedValue(gql("userAlreadyExists"));
        const { hook, fillValid, submit, type } = setup();
        fillValid(); await submit();
        type("email", "new@b.co");
        expect(hook.result.current.formError).toBeNull();
    });
});
