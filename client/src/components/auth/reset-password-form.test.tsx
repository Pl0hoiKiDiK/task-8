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
    it("token exists? - form with two fields", () => {
        render(<ResetPasswordForm token="t" />);
        expect(screen.getByLabelText("New password")).toBeTruthy();
        expect(screen.getByLabelText("Confirm password")).toBeTruthy();
    });
    it("token not exists / expired - readable message", () => {
        render(<ResetPasswordForm token={undefined} />);
        expect(screen.getByRole("alert").textContent).toBe("This password reset link has expired");
        expect(screen.queryByText(/Here you should write a new password/)).toBeNull();
    });
    it("token not exists - form not shows", () => {
        render(<ResetPasswordForm token={undefined} />);
        expect(screen.queryByLabelText("New password")).toBeNull();
    });
    it("password changed, autologin faild - sign in ref", () => {
        state.passwordChanged = true;
        render(<ResetPasswordForm token="t" />);
        expect(screen.getByRole("status").textContent).toMatch(/password has been changed/i);
        expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/signin");
    });
});
