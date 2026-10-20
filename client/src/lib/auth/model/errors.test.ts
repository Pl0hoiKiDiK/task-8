import { describe, expect, it } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { getAuthErrorMessage } from "./errors";

const gqlError = (message?: string) =>
    new CombinedGraphQLErrors({ data: null, errors: message ? [{ message }] : [] });

describe("getAuthErrorMessage", () => {
    it("maps known server codes", () => {
        expect(getAuthErrorMessage(gqlError("invalidCredentials"))).toBe("Invalid email or password");
        expect(getAuthErrorMessage(gqlError("userAlreadyExists"))).toBe("An account with this email already exists");
    });
    it("overrides win over defaults", () => {
        expect(getAuthErrorMessage(gqlError("actionExpired"), { actionExpired: "custom" })).toBe("custom");
    });
    it("unknown code or empty errors = generic message", () => {
        expect(getAuthErrorMessage(gqlError("somethingNew"))).toBe("Something went wrong. Please try again.");
        expect(getAuthErrorMessage(gqlError())).toBe("Something went wrong. Please try again.");
    });
    it("non-GraphQL error = network message", () => {
        expect(getAuthErrorMessage(new TypeError("Failed to fetch"))).toMatch(/Cannot reach the server/);
    });
    it("Empty login response - network message", () => {
        expect(getAuthErrorMessage(new Error("Empty login response"))).toMatch(/Cannot reach the server/);
    });
    it("case matters: 'Unauthorized' (Nest default) is NOT 'unauthorized'", () => {
        expect(getAuthErrorMessage(gqlError("unauthorized"))).toMatch(/session has expired/);
    });
});
