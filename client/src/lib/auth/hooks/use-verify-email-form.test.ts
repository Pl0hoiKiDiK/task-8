import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { asGuest, asUser, makeStore, withStore } from "../test-utils";

const replace = vi.fn();
const verify = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@apollo/client/react", () => ({ useMutation: () => [verify, { loading: false }] }));

import { useVerifyEmailForm } from "./use-verify-email-form";

const setup = (prepare: (s: ReturnType<typeof makeStore>) => void) => {
    const store = makeStore(); prepare(store);
    return { store, ...renderHook(() => useVerifyEmailForm(), { wrapper: withStore(store) }) };
};
const fill = (r: { current: ReturnType<typeof useVerifyEmailForm> }, code = "123456") =>
    act(() => r.current.setDigits(code.split("")));
const submit = (r: { current: ReturnType<typeof useVerifyEmailForm> }) =>
    act(async () => { await r.current.handleSubmit({ preventDefault() { } } as never); });

beforeEach(() => vi.clearAllMocks());

describe("useVerifyEmailForm", () => {
    it("guest = /signin", () => {
        setup(asGuest);
        expect(replace).toHaveBeenCalledWith("/signin");
    });
    it("already verified = home page by role", () => {
        setup((s) => asUser(s, "Admin", true));
        expect(replace).toHaveBeenCalledWith("/admin/employees");
    });
    it("unverified: isReady, no redirect", () => {
        const { result } = setup((s) => asUser(s, "Employee", false));
        expect(result.current.isReady).toBe(true);
        expect(replace).not.toHaveBeenCalled();
    });
    it("while session is restoring - not ready and not redirecting", () => {
        const { result } = setup(() => { });
        expect(result.current.isReady).toBe(false);
        expect(replace).not.toHaveBeenCalled();
    });
    it("canSubmit until >= 6 digits", () => {
        const { result } = setup((s) => asUser(s, "Employee", false));
        fill(result, "12345");
        expect(result.current.canSubmit).toBe(false);
        fill(result);
        expect(result.current.canSubmit).toBe(true);
    });
    it("valid code = emailVerified, then redirect to the home page", async () => {
        verify.mockResolvedValue({});
        const { result, store } = setup((s) => asUser(s, "Employee", false));
        fill(result); await submit(result);
        expect(verify).toHaveBeenCalledWith({ variables: { mail: { otp: "123456" } } });
        expect(store.getState().auth.user?.is_verified).toBe(true);
        expect(replace).toHaveBeenCalledWith("/employees");
    });
    it.each([
        ["mailNotFound", "Invalid verification code"],
        ["unauthorized", "Verification code has expired"],
    ])("server error", async (code, text) => {
        verify.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: code }] }));
        const { result } = setup((s) => asUser(s, "Employee", false));
        fill(result); await submit(result);
        expect(result.current.error).toBe(text);
    });
    it("«Later» leads to home page", () => {
        const { result } = setup((s) => asUser(s, "Employee", false));
        act(() => result.current.handleLater());
        expect(replace).toHaveBeenCalledWith("/employees");
    });
});
