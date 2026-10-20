import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { makeJwt } from "../test-utils";
import { restoreSession } from "./restore-session";

const store = new Map<string, string>();
const KEY = "cv-builder-refresh-token";
const user = { id: "42", email: "a@b.co", role: "Employee", is_verified: true };
const access = makeJwt({ sub: "42", email: "a@b.co", role: "Employee", exp: 9999999999 });

type MutateOptions = { context: { headers: { authorization: string } } };
type QueryOptions = MutateOptions & { variables: { userId: string } };
type MutateResult = { data: { updateToken: { access_token: string; refresh_token: string } } | null };
type QueryResult = { data: { user: typeof user } | null };

type Mutate = (options: MutateOptions) => Promise<MutateResult>;
type Query = (options: QueryOptions) => Promise<QueryResult>;

const makeClient = (over: { mutate?: Mutate; query?: Query  } = {}) => ({
    mutate: vi.fn<Mutate>(over.mutate ?? (async () => ({ data: { updateToken: { access_token: access, refresh_token: "new-refresh" } } }))),
    query: vi.fn<Query>(over.query ?? (async () => ({ data: { user } }))),
})

const run = (c: ReturnType<typeof makeClient>) => restoreSession(c as never)
const gqlError = new CombinedGraphQLErrors({ data: null, errors: [{ message: "Unauthorized" }] })

beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
    });
});
afterEach(() => vi.unstubAllGlobals());

describe("restoreSession", () => {
    it("no refresh token → null, no requests", async () => {
        const c = makeClient();
        expect(await run(c)).toBeNull();
        expect(c.mutate).not.toHaveBeenCalled();
    });

    it("happy path: rotates refresh token and returns user + access token", async () => {
        store.set(KEY, "old-refresh");
        const c = makeClient();
        expect(await run(c)).toEqual({ user, accessToken: access });
        expect(store.get(KEY)).toBe("new-refresh");
        expect(c.mutate.mock.calls[0][0].context.headers.authorization).toBe("Bearer old-refresh");
        expect(c.query.mock.calls[0][0].variables).toEqual({ userId: "42" });
        expect(c.query.mock.calls[0][0].context.headers.authorization).toBe(`Bearer ${access}`)
    });

    it("GraphQL error (refresh token rejected) → null and token is cleared", async () => {
        store.set(KEY, "bad");
        const c = makeClient({ mutate: async () => { throw gqlError; } });
        expect(await run(c)).toBeNull();
        expect(store.has(KEY)).toBe(false);
    });

    it("network error → rejects (not 'guest') and the token is KEPT", async () => {
        store.set(KEY, "keep-me");
        const c = makeClient({ mutate: async () => { throw new TypeError("Failed to fetch") } })
        await expect(run(c)).rejects.toThrow("Failed to fetch");
        expect(store.get(KEY)).toBe("keep-me");
    });
    it("network error on the user query → rejects too, token already rotated and kept", async () => {
        store.set(KEY, "old");
        const c = makeClient({ query: async () => { throw new TypeError("Failed to fetch") } })
        await expect(run(c)).rejects.toThrow();
        expect(store.get(KEY)).toBe("new-refresh");
    });

    it("access token that cannot be decoded → null, user query is not sent", async () => {
        store.set(KEY, "r")
        const c = makeClient({ mutate: async () => ({ data: { updateToken: { access_token: "junk", refresh_token: "r2" } } }) })
        expect(await run(c)).toBeNull()
        expect(c.query).not.toHaveBeenCalled()
    });

    it("empty data from mutate / query → null", async () => {
        store.set(KEY, "r");
        expect(await run(makeClient({ mutate: async () => ({ data: null }) }))).toBeNull();
        expect(await run(makeClient({ query: async () => ({ data: null }) }))).toBeNull();
    });
});
