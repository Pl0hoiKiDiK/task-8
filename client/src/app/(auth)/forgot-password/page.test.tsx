import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state: { sentTo: string | null; formError: string | null } = { sentTo: null, formError: null };
vi.mock("@/lib/auth/hooks/use-forgot-password-form", () => ({
    useForgotPasswordForm: () => ({
        email: "", emailError: undefined, formError: state.formError, sentTo: state.sentTo,
        loading: false, canSubmit: false, handleChange() { }, handleBlur() { }, handleSubmit() { },
    }),
}));

import ForgotPasswordPage from "./page";

beforeEach(() => { state.sentTo = null; state.formError = null; });

describe("ForgotPasswordPage", () => {
    it("form: email field, submit button is disabled with invalid input, cancel link", () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByLabelText("Email")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Reset password" }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByRole("link", { name: "Cancel" }).getAttribute("href")).toBe("/signin");
    });
    it("after submission: confirmation with email and back link, no form", () => {
        state.sentTo = "a@b.co";
        render(<ForgotPasswordPage />);
        expect(screen.getByRole("status").textContent).toContain("a@b.co");
        expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/signin");
        expect(screen.queryByLabelText("Email")).toBeNull();
    });
    it("form error is shown as an alert", () => {
        state.formError = "No account found with this email address";
        render(<ForgotPasswordPage />);
        expect(screen.getByRole("alert").textContent).toBe("No account found with this email address");
    });
});
