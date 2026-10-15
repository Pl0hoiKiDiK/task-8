import { describe, expect, it } from "vitest";
import { PASSWORD_MIN_LENGTH, validateChangePassword, validateSignup } from "@/lib/auth/model/validation";

const valid = {
    email: "user@example.com",
    password: "a".repeat(PASSWORD_MIN_LENGTH),
    confirmPassword: "a".repeat(PASSWORD_MIN_LENGTH),
};

describe("validateSignup", () => {
    it("returns no errors for valid values", () => {
        expect(validateSignup(valid)).toEqual({});
    });

    it("requires all fields", () => {
        const errors = validateSignup({ email: "", password: "", confirmPassword: "" });
        expect(Object.keys(errors).sort()).toEqual(["confirmPassword", "email", "password"]);
    });

    it("rejects an invalid email", () => {
        expect(validateSignup({ ...valid, email: "not-an-email" }).email).toBeDefined();
    });

    it("trims the email before checking", () => {
        expect(validateSignup({ ...valid, email: "  user@example.com  " }).email).toBeUndefined();
    });

    it("rejects a short password", () => {
        const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);
        expect(validateSignup({ ...valid, password: short, confirmPassword: short }).password).toBeDefined();
    });

    it("rejects mismatched confirmation", () => {
        expect(validateSignup({ ...valid, confirmPassword: valid.password + "x" }).confirmPassword).toBeDefined();
    });
});

describe("validateChangePassword", () => {
    const validChange = {
        password: "old-secret",
        newPassword: "new-secret",
        confirmPassword: "new-secret",
    };

    it("enables a complete password change", () => {
        expect(validateChangePassword(validChange)).toEqual({});
    });

    it("requires all fields and matches the confirmation", () => {
        expect(Object.keys(validateChangePassword({ password: "", newPassword: "", confirmPassword: "" })).sort())
            .toEqual(["confirmPassword", "newPassword", "password"]);
        expect(validateChangePassword({ ...validChange, confirmPassword: "different" }).confirmPassword)
            .toBe("Passwords do not match");
    });

    it("uses the server password length and rejects reusing the current password", () => {
        expect(validateChangePassword({ ...validChange, newPassword: "short", confirmPassword: "short" }).newPassword)
            .toBeDefined();
        expect(validateChangePassword({ ...validChange, newPassword: validChange.password, confirmPassword: validChange.password }).newPassword)
            .toBe("New password must be different from current password");
    });
});
