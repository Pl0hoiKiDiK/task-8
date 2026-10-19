import { describe, expect, it } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { getAuthErrorMessage } from "./errors";

const gqlError = (message: string) =>
    new CombinedGraphQLErrors({ data: null, errors: [{ message }] });

const VERIFY_ERROR_OVERRIDES = {
    mailNotFound: "Invalid verification code",
    Unauthorized: "Verification code has expired",
};

describe("verify email errors", () => {
    it("wrong code → Invalid verification code", () => {
        expect(getAuthErrorMessage(gqlError("mailNotFound"), VERIFY_ERROR_OVERRIDES))
            .toBe("Invalid verification code");
    });
    it("expired → Verification code has expired", () => {
        expect(getAuthErrorMessage(gqlError("unauthorized"), VERIFY_ERROR_OVERRIDES))
            .toBe("Verification code has expired");
    });
});