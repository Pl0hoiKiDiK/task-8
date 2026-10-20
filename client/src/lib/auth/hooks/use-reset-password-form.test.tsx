import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { makeJwt } from "../test-utils";

const reset = vi.fn();
const login = vi.fn();
const startSession = vi.fn();

vi.mock("@apollo/client/react", () => ({
    useMutation: (doc: { definitions: { name: { value: string } }[] }) =>
        [doc.definitions[0].name.value === "ResetPassword" ? reset : login, { loading: false }],
}));
vi.mock("@/lib/auth/hooks/use-start-session", () => ({ useStartSession: () => startSession }));

import { useResetPasswordForm } from "./use-reset-password-form";

const token = makeJwt({ sub: "1", email: "a@b.co", role: "Employee", exp: 9999999999 });
const authResult = { access_token: "A", refresh_token: "R", user: { id: "1", email: "a@b.co", role: "Employee", is_verified: true } };
const gqlError = (m: string) => new CombinedGraphQLErrors({ data: null, errors: [{ message: m }] });

async function submit(t: string | undefined, passwords = { newPassword: "secret1", confirmPassword: "secret1" }) {
    const { result } = renderHook(() => useResetPasswordForm(t));
    act(() => {
        for (const [name, value] of Object.entries(passwords))
            result.current.handleChange({ target: { name, value } } as never);
    });
    await act(async () => { await result.current.handleSubmit({ preventDefault() { } } as never); });
    return result;
}

beforeEach(() => { vi.clearAllMocks(); reset.mockResolvedValue({}); login.mockResolvedValue({ data: { login: authResult } }); });

describe("useResetPasswordForm", () => {
    it("success leads to autologin = startSession with login data", async () => {
        const r = await submit(token);
        expect(reset).toHaveBeenCalledWith(expect.objectContaining({
            variables: { auth: { newPassword: "secret1", confirmPassword: "secret1" } },
            context: { headers: { authorization: `Bearer ${token}` } },
        }));
        expect(login.mock.calls[0][0].variables).toEqual({ auth: { email: "a@b.co", password: "secret1" } });
        expect(startSession).toHaveBeenCalledWith(authResult);
        expect(r.current.passwordChanged).toBe(false);
    });

    it("reset succeeded, autologin failed = passwordChanged", async () => {
        login.mockRejectedValue(new TypeError("Failed to fetch"));
        const r = await submit(token);
        expect(r.current.passwordChanged).toBe(true);
        expect(startSession).not.toHaveBeenCalled();
    });

    it("no email in token = passwordChanged, login not called", async () => {
        const r = await submit(makeJwt({ sub: "1", exp: 9999999999 }));
        expect(r.current.passwordChanged).toBe(true);
        expect(login).not.toHaveBeenCalled();
    });

    it("actionExpired is readable mistake, login not called", async () => {
        reset.mockRejectedValue(gqlError("actionExpired"));
        const r = await submit(token);
        expect(r.current.formError).toBe("This password reset link has expired");
        expect(login).not.toHaveBeenCalled();
        expect(r.current.passwordChanged).toBe(false);
    });

    it("no token or invalid passwords = nothing is submitted", async () => {
        await submit(undefined);
        await submit(token, { newPassword: "123", confirmPassword: "456" });
        expect(reset).not.toHaveBeenCalled();
    });
});
