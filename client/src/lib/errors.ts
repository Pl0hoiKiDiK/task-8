import { CombinedGraphQLErrors } from "@apollo/client";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_MESSAGE = "Cannot reach the server. Check your connection and try again.";

const MESSAGES: Record<string, string> = {
    invalidCredentials: "Invalid email or password",
    failedToSendEmail: "We could not send the confirmation email. Please try again later.",
};

export function getAuthErrorMessage(error: unknown): string {
    if (CombinedGraphQLErrors.is(error)) {
        const message = error.errors[0]?.message;
        return (message && MESSAGES[message]) || GENERIC_MESSAGE;
    }
    return NETWORK_MESSAGE;
}