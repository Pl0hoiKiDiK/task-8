import { CombinedGraphQLErrors, CombinedProtocolErrors } from "@apollo/client/errors";
import { RetryLink } from "@apollo/client/link/retry";
import { waitForRetry } from "./network-status";

export function isNetworkFailure(error: unknown): boolean {
    return !CombinedGraphQLErrors.is(error) && !CombinedProtocolErrors.is(error);
}
export function createNetworkRetryLink() {
    return new RetryLink({
        delay: () => 0,
        attempts: (_attempt, _operation, error) =>
            typeof window !== "undefined" && isNetworkFailure(error) ? waitForRetry() : false,
    });
}
