import { CombinedGraphQLErrors } from "@apollo/client";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_MESSAGE = "Cannot reach the server. Check your connection and try again.";

const MESSAGES: Record<string, string> = {
    invalidEmail: "Enter a valid email",
    passwordTooShort: "Password is too short",
    confirmPasswordTooShort: "Password is too short",
    confirmPasswordMismatch: "Passwords do not match",
    userAlreadyExists: "An account with this email already exists",
    invalidCredentials: "Invalid email or password",
    failedToSendEmail: "Account created, but we could not send the confirmation email.",
    mailNotFound: "Invalid verification code",
};

export function getAuthErrorMessage(error: unknown): string {
    if (CombinedGraphQLErrors.is(error)) {
        const message = error.errors[0]?.message;
        return (message && MESSAGES[message]) || GENERIC_MESSAGE;
    }
    return NETWORK_MESSAGE;
}