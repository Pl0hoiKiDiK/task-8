import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";

const forgot = vi.fn();
vi.mock("@apollo/client/react", () => ({ useMutation: () => [forgot, { loading: false }] }));

import { useForgotPasswordForm } from "./use-forgot-password-form";

function setup() {
    const hook = renderHook(() => useForgotPasswordForm());
    const type = (value: string) => act(() => hook.result.current.handleChange({ target: { value } } as never));
    const submit = () => act(async () => { await hook.result.current.handleSubmit({ preventDefault() { } } as never); });
    return { hook, type, submit };
}
beforeEach(() => vi.clearAllMocks());

describe("useForgotPasswordForm", () => {
    it("успех: отправляется триммленный email, sentTo показывает адрес", async () => {
        forgot.mockResolvedValue({});
        const { hook, type, submit } = setup();
        type("  a@b.co "); await submit();
        expect(forgot).toHaveBeenCalledWith({ variables: { auth: { email: "a@b.co" } } });
        expect(hook.result.current.sentTo).toBe("a@b.co");
    });
    it("failedToSendEmail - No account found", async () => {
        forgot.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "failedToSendEmail" }] }));
        const { hook, type, submit } = setup();
        type("a@b.co"); await submit();
        expect(hook.result.current.formError).toBe("No account found with this email address");
        expect(hook.result.current.sentTo).toBeNull();
    });
    it("network error - common message, 'sentTo' not set", async () => {
        forgot.mockRejectedValue(new TypeError("Failed to fetch"));
        const { hook, type, submit } = setup();
        type("a@b.co"); await submit();
        expect(hook.result.current.formError).toMatch(/Cannot reach the server/);
        expect(hook.result.current.sentTo).toBeNull();
    });
    it("invalid email: canSubmit=false, request not sent; error visible only after blur", async () => {
        const { hook, type, submit } = setup();
        type("bad");
        expect(hook.result.current.canSubmit).toBe(false);
        expect(hook.result.current.emailError).toBeUndefined();
        act(() => hook.result.current.handleBlur());
        expect(hook.result.current.emailError).toBe("Please enter a valid email address");
        await submit();
        expect(forgot).not.toHaveBeenCalled();
    });
    it("input clears formError", async () => {
        forgot.mockRejectedValue(new TypeError("x"));
        const { hook, type, submit } = setup();
        type("a@b.co"); await submit();
        type("a@b.com");
        expect(hook.result.current.formError).toBeNull();
    });
});
