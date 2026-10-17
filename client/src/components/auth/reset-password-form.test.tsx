import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = { passwordChanged: false };
vi.mock("@/lib/auth/hooks/use-reset-password-form", () => ({
    useResetPasswordForm: () => ({
        values: { newPassword: "", confirmPassword: "" }, errors: {}, formError: null, loading: false,
        passwordChanged: state.passwordChanged, canSubmit: false, handleChange() { }, handleBlur() { }, handleSubmit() { },
    }),
}));

import { ResetPasswordForm } from "./reset-password-form";

beforeEach(() => { state.passwordChanged = false; });

describe("ResetPasswordForm", () => {
    it("token exists - form with two fields", () => {
        render(<ResetPasswordForm token="t" />);
        expect(screen.getByLabelText("New password")).toBeTruthy();
        expect(screen.getByLabelText("Confirm password")).toBeTruthy();
    });
    it("token is missing or expired - clear message, not constant name", () => {
        render(<ResetPasswordForm token={undefined} />);
        expect(screen.getByRole("alert").textContent).toBe("This password reset link has expired");
    });
    it("token is missing - no form", () => {
        render(<ResetPasswordForm token={undefined} />);
        expect(screen.queryByLabelText("New password")).toBeNull();
    });
    it("password has been changed, auto-login failed - link to sign in", () => {
        state.passwordChanged = true;
        render(<ResetPasswordForm token="t" />);
        expect(screen.getByRole("status").textContent).toMatch(/password has been changed/i);
        expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/signin");
    });
});
