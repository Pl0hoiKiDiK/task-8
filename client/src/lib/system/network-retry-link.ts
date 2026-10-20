import type { ApolloLink } from "@apollo/client";
import { CombinedGraphQLErrors, CombinedProtocolErrors } from "@apollo/client/errors";
import { RetryLink } from "@apollo/client/link/retry";
import { getMainDefinition } from "@apollo/client/utilities";
import { waitForRetry } from "./network-status";

export function isNetworkFailure(error: unknown): boolean {
    return !CombinedGraphQLErrors.is(error) && !CombinedProtocolErrors.is(error);
}

const REPLAY_SAFE_MUTATIONS = new Set(["LoginUser", "UpdateToken", "ForgotPassword"]);

export function isReplaySafe(operation: ApolloLink.Operation): boolean {
    const definition = getMainDefinition(operation.query);
    if (definition.kind !== "OperationDefinition") return false;
    if (definition.operation === "query") return true;
    return definition.operation === "mutation" && REPLAY_SAFE_MUTATIONS.has(operation.operationName ?? "");
}

export function createNetworkRetryLink() {
    return new RetryLink({
        delay: () => 0,
        attempts: (_attempt, operation, error) =>
            typeof window !== "undefined" && isNetworkFailure(error) && isReplaySafe(operation) ? waitForRetry() : false,
    });
}
