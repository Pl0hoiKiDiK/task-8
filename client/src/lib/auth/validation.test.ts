import { describe, expect, it } from "vitest";
import { PASSWORD_MIN_LENGTH, validateSignup } from "@/lib/auth/validation";

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