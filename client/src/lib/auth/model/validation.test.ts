import { describe, expect, it } from "vitest";
import {
    OTP_LENGTH, PASSWORD_MIN_LENGTH, checkConfirmPassword, checkEmail, checkPassword,
    isOtpComplete, validateForgotPassword, validateLogin, validateResetPassword,
} from "./validation";

describe("checkEmail", () => {
    it.each(["", "   "])("required: %j", (v) => expect(checkEmail(v)).toBe("Email is required"));
    it.each(["a", "a@b", "a@@b.co", "a b@c.de", "@b.co"])("invalid: %s", (v) => expect(checkEmail(v)).toBeDefined());
    it.each(["a@b.co", " a@b.co ", "a+tag@sub.domain.org"])("valid: %s", (v) => expect(checkEmail(v)).toBeUndefined());
});

describe("checkPassword", () => {
    it("required / min length boundary", () => {
        expect(checkPassword("")).toBe("Password is required");
        expect(checkPassword("a".repeat(PASSWORD_MIN_LENGTH - 1))).toBeDefined();
        expect(checkPassword("a".repeat(PASSWORD_MIN_LENGTH))).toBeUndefined();
    });
    it("spaces count as characters (пароль не триммится)", () => {
        expect(checkPassword(" ".repeat(PASSWORD_MIN_LENGTH))).toBeUndefined();
    });
});

describe("checkConfirmPassword", () => {
    it("required and must match", () => {
        expect(checkConfirmPassword("abcdef", "")).toBe("Confirm Password is required");
        expect(checkConfirmPassword("abcdef", "abcdeg")).toBe("Passwords do not match");
        expect(checkConfirmPassword("abcdef", "abcdef")).toBeUndefined();
    });
});

describe("validateLogin", () => {
    it("collects both errors", () => {
        expect(Object.keys(validateLogin({ email: "x", password: "" })).sort()).toEqual(["email", "password"]);
    });
    it("passes valid data", () => expect(validateLogin({ email: "a@b.co", password: "123456" })).toEqual({}));
});

describe("validateResetPassword / validateForgotPassword", () => {
    it("reset: errors keyed by newPassword/confirmPassword", () => {
        expect(Object.keys(validateResetPassword({ newPassword: "", confirmPassword: "" })).sort())
            .toEqual(["confirmPassword", "newPassword"]);
        expect(validateResetPassword({ newPassword: "abcdef", confirmPassword: "abcdef" })).toEqual({});
    });
    it("forgot", () => {
        expect(validateForgotPassword({ email: "bad" }).email).toBeDefined();
        expect(validateForgotPassword({ email: "a@b.co" })).toEqual({});
    });
});

describe("isOtpComplete", () => {
    it("exactly OTP_LENGTH digits", () => {
        expect(isOtpComplete("1".repeat(OTP_LENGTH))).toBe(true);
        expect(isOtpComplete("1".repeat(OTP_LENGTH - 1))).toBe(false);
        expect(isOtpComplete("1".repeat(OTP_LENGTH + 1))).toBe(false);
        expect(isOtpComplete("12345a")).toBe(false);
        expect(isOtpComplete("12 456")).toBe(false);
        expect(isOtpComplete("123456\n")).toBe(false);
    });
});
