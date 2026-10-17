import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";

const login = vi.fn();
const startSession = vi.fn();
vi.mock("@apollo/client/react", () => ({ useMutation: () => [login, { loading: false }] }));
vi.mock("@/lib/auth/hooks/use-start-session", () => ({ useStartSession: () => startSession }));

import { useLoginForm } from "./use-login-form";

const result_ = { access_token: "A", refresh_token: "R", user: { id: "1", email: "a@b.co", role: "Employee", is_verified: true } };

function setup() {
    const hook = renderHook(() => useLoginForm());
    const type = (name: string, value: string) =>
        act(() => hook.result.current.handleChange({ target: { name, value } } as never));
    const submit = () => act(async () => { await hook.result.current.handleSubmit({ preventDefault() { } } as never) });
    return { hook, type, submit };
}
beforeEach(() => vi.clearAllMocks());

describe("useLoginForm", () => {
    it("button is disabled while the form is invalid.", () => {
        const { hook, type } = setup()
        expect(hook.result.current.canSubmit).toBe(false)
        type("email", "a@b.co"); type("password", "secret1")
        expect(hook.result.current.canSubmit).toBe(true)
    });
    it("errors are shown only after blur", () => {
        const { hook, type } = setup()
        type("email", "bad")
        expect(hook.result.current.errors.email).toBeUndefined()
        act(() => hook.result.current.handleBlur({ target: { name: "email" } } as never))
        expect(hook.result.current.errors.email).toBeDefined()
    });
    it("success: email is trimmed, startSession is called", async () => {
        login.mockResolvedValue({ data: { login: result_ } })
        const { type, submit } = setup()
        type("email", "  a@b.co "); type("password", "secret1")
        await submit()
        expect(login).toHaveBeenCalledWith({ variables: { auth: { email: "a@b.co", password: "secret1" } } });
        expect(startSession).toHaveBeenCalledWith(result_)
    });
    it("invalid password leads to form message", async () => {
        login.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "invalidCredentials" }] }))
        const { hook, type, submit } = setup()
        type("email", "a@b.co"); type("password", "secret1")
        await submit();
        expect(hook.result.current.formError).toBe("Invalid email or password")
        expect(startSession).not.toHaveBeenCalled()
    });
    it("input clears formError", async () => {
        login.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "invalidCredentials" }] }));
        const { hook, type, submit } = setup();
        type("email", "a@b.co"); type("password", "secret1");
        await submit();
        type("password", "secret12");
        expect(hook.result.current.formError).toBeNull()
    });
    it("invalid form is not submitted", async () => {
        const { submit } = setup()
        await submit()
        expect(login).not.toHaveBeenCalled()
    });
});
