import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApolloLink, gql } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { Observable, lastValueFrom } from "rxjs";
import { configureStore } from "@reduxjs/toolkit";
import { authReducer, sessionStarted, refreshTokenStorage } from "@/lib/auth/model/auth-slice";
import { createRefreshLink } from "./refresh-link";

const QUERY = gql`query Employees { users { id } }`;
const unauth = { errors: [{ message: "unauthorized", extensions: { code: "UNAUTHENTICATED" } }], data: null };

function setup(handler: (token: string | undefined, n: number) => unknown) {
    const store = configureStore({ reducer: { auth: authReducer } }) as never;
    (store as any).dispatch(sessionStarted({ user: { id: "1", email: "a@b.c", role: "ADMIN" as never, is_verified: true }, accessToken: "old" }));
    let n = 0;
    const terminal = new ApolloLink((op) => {
        const token = op.getContext().headers?.authorization?.replace("Bearer ", "");
        const result = handler(token, ++n);
        return new Observable((o) => { o.next(result as never); o.complete(); });
    });
    const authLike = new SetContextLink(({ headers }) => {
        const token = (store as any).getState().auth.accessToken;
        if (!token || headers?.authorization) return {};
        return { headers: { ...headers, authorization: `Bearer ${token}` } };
    });
    const link = ApolloLink.from([createRefreshLink(store, "http://x/graphql"), authLike, terminal]);
    const run = () => lastValueFrom(ApolloLink.execute(link, { query: QUERY, operationName: "Employees" } as never, { client: { queryManager: { incrementalHandler: { isIncrementalResult: () => false } } } } as never));
    return { store: store as any, run, calls: () => n };
}

describe("refresh link", () => {
    beforeEach(() => { localStorage.clear(); refreshTokenStorage.set("r1"); });

    it("refreshes once and retries parallel requests with the new token", async () => {
        const fetchMock = vi.fn(async () => ({ json: async () => ({ data: { updateToken: { access_token: "new", refresh_token: "r2" } } }) }));
        vi.stubGlobal("fetch", fetchMock);
        const { run, store } = setup((token) => (token === "new" ? { data: { users: [] } } : unauth));
        const [a, b] = await Promise.all([run(), run()]);
        expect((a as any).data).toEqual({ users: [] });
        expect((b as any).data).toEqual({ users: [] });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(refreshTokenStorage.get()).toBe("r2");
        expect(store.getState().auth.accessToken).toBe("new");
    });

    it("clears the session when the refresh token is rejected", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ errors: [{ message: "unauthorized" }], data: null }) })));
        const { run, store } = setup(() => unauth);
        await run().catch(() => undefined);
        expect(store.getState().auth.user).toBeNull();
        expect(refreshTokenStorage.get()).toBeNull();
    });

    it("keeps the session on a network failure", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
        const { run, store } = setup(() => unauth);
        await run().catch(() => undefined);
        expect(store.getState().auth.user).not.toBeNull();
        expect(refreshTokenStorage.get()).toBe("r1");
    });

    it("does not loop if the new token is also rejected", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ data: { updateToken: { access_token: "new", refresh_token: "r2" } } }) })));
        const { run, calls } = setup(() => unauth);
        await run().catch(() => undefined);
        expect(calls()).toBe(2);
    });
});
