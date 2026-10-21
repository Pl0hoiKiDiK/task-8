import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";
import { from, mergeMap, throwError } from "rxjs";
import type { AppStore } from "@/lib/store";
import { accessTokenUpdated, refreshTokenStorage, sessionCleared } from "@/lib/auth/model/auth-slice";

const SKIP_OPERATIONS = new Set(["UpdateToken", "LoginUser"]);

type TokenPair = { access_token: string; refresh_token: string };

async function requestNewTokens(uri: string, refreshToken: string): Promise<TokenPair | null> {
    const response = await fetch(uri, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${refreshToken}` },
        body: JSON.stringify({
            operationName: "UpdateToken",
            query: "mutation UpdateToken { updateToken { access_token refresh_token } }",
        }),
    });
    const json = await response.json().catch(() => null);
    return json?.data?.updateToken ?? null;
}

function isUnauthenticated(error: unknown): boolean {
    return (
        CombinedGraphQLErrors.is(error) &&
        error.errors.some(
            (e) =>
                e.extensions?.code === "UNAUTHENTICATED" ||
                (e.extensions?.originalError as { statusCode?: number } | undefined)?.statusCode === 401,
        )
    );
}

type Outcome = { status: "ok"; accessToken: string } | { status: "rejected" } | { status: "offline" };

export function createRefreshLink(store: AppStore, uri: string) {
    let refreshing: Promise<Outcome> | null = null;

    const refresh = (): Promise<Outcome> =>
    (refreshing ??= (async (): Promise<Outcome> => {
        const refreshToken = refreshTokenStorage.get();
        if (!refreshToken) return { status: "rejected" };
        try {
            const tokens = await requestNewTokens(uri, refreshToken);
            if (!tokens) return { status: "rejected" };
            refreshTokenStorage.set(tokens.refresh_token);
            store.dispatch(accessTokenUpdated(tokens.access_token));
            return { status: "ok", accessToken: tokens.access_token };
        } catch {
            return { status: "offline" };
        }
    })().finally(() => {
        refreshing = null;
    }));

    return new ErrorLink(({ error, operation, forward }) => {
        if (!isUnauthenticated(error)) return;
        if (SKIP_OPERATIONS.has(operation.operationName ?? "")) return;
        if (!store.getState().auth.accessToken) return;
        if (operation.getContext().authRetried) return;

        return from(refresh()).pipe(
            mergeMap((outcome) => {
                if (outcome.status === "offline") return throwError(() => error);
                if (outcome.status === "rejected") {
                    refreshTokenStorage.clear();
                    store.dispatch(sessionCleared());
                    return throwError(() => error);
                }
                operation.setContext(({ headers }: { headers?: Record<string, string> }) => ({
                    authRetried: true,
                    headers: { ...headers, authorization: `Bearer ${outcome.accessToken}` },
                }));
                return forward(operation);
            }),
        );
    });
}
