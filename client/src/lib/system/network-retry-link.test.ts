import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { createNetworkRetryLink, isNetworkFailure } from "./network-retry-link";
import { isRequestFailed, retryFailedRequests } from "./network-status";

const LOGIN = gql`mutation L { login { access_token } }`;
const ME = gql`query Me { me { id } }`;

type Handler = (res: import("node:http").ServerResponse) => void;
const json = (body: unknown, status = 200): Handler => (res) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
};

let server: Server | undefined;
const listen = (port: number, handler: Handler) =>
    new Promise<number>((resolve) => {
        server = createServer((_, res) => handler(res)).listen(port, "127.0.0.1", () =>
            resolve((server!.address() as AddressInfo).port));
    });
const stop = () => new Promise<void>((r) => (server ? server.close(() => r()) : r()));

async function deadPort() {
    const port = await listen(0, json({}));
    await stop();
    server = undefined;
    return port;
}
const makeClient = (port: number) =>
    new ApolloClient({
        cache: new InMemoryCache(),
        devtools: { enabled: false },
        link: createNetworkRetryLink().concat(new HttpLink({ uri: `http://127.0.0.1:${port}/graphql` })),
    });

vi.stubGlobal("window", {});

afterEach(async () => { retryFailedRequests(); await stop(); server = undefined; });

describe("inaccessible server", () => {
    it("MUTATION: screen shows, request waits, after Retry it's sent again and completes", async () => {
        const port = await deadPort();
        const request = makeClient(port).mutate({ mutation: LOGIN });
        let settled = false;
        void request.then(() => (settled = true), () => (settled = true));

        await vi.waitFor(() => expect(isRequestFailed()).toBe(true));
        expect(settled).toBe(false);

        await listen(port, json({ data: { login: { __typename: "Auth", access_token: "T" } } }));
        retryFailedRequests();

        const { data } = await request;
        expect(data).toEqual({ login: { __typename: "Auth", access_token: "T" } });
        expect(isRequestFailed()).toBe(false);
    });

    it("QUERY: the same", async () => {
        const port = await deadPort();
        const request = makeClient(port).query({ query: ME, fetchPolicy: "network-only" });
        await vi.waitFor(() => expect(isRequestFailed()).toBe(true));

        await listen(port, json({ data: { me: { __typename: "User", id: "1" } } }));
        retryFailedRequests();
        expect((await request).data).toEqual({ me: { __typename: "User", id: "1" } });
    });

    it("server is still down - after Retry screen returns, request still waits", async () => {
        const port = await deadPort();
        const request = makeClient(port).mutate({ mutation: LOGIN });
        await vi.waitFor(() => expect(isRequestFailed()).toBe(true));

        retryFailedRequests();
        expect(isRequestFailed()).toBe(false);
        await vi.waitFor(() => expect(isRequestFailed()).toBe(true));

        await listen(port, json({ data: { login: { __typename: "Auth", access_token: "T" } } }));
        retryFailedRequests();
        await expect(request).resolves.toBeDefined();
    });

    it("two simultaneous requests are retried with a single Retry click", async () => {
        const port = await deadPort();
        const client = makeClient(port);
        const a = client.mutate({ mutation: LOGIN });
        const b = client.query({ query: ME, fetchPolicy: "network-only" });
        await vi.waitFor(() => expect(isRequestFailed()).toBe(true));

        await listen(port, (res) =>
            json({ data: { login: { __typename: "Auth", access_token: "T" }, me: { __typename: "User", id: "1" } } })(res));
        retryFailedRequests();
        await expect(Promise.all([a, b])).resolves.toHaveLength(2);
    });
});

describe("working server", () => {
    it("GraphQL error (invalid password) does not trigger screen and is returned to the form", async () => {
        const port = await listen(0, json({ data: null, errors: [{ message: "invalidCredentials" }] }));
        await expect(makeClient(port).mutate({ mutation: LOGIN })).rejects.toSatisfy(
            (e) => CombinedGraphQLErrors.is(e) && e.errors[0].message === "invalidCredentials");
        expect(isRequestFailed()).toBe(false);
    });

    it("HTTP 500 without GraphQL-body is also considered a failure and is waiting Retry", async () => {
        const port = await listen(0, (res) => { res.writeHead(500); res.end("boom"); });
        const request = makeClient(port).mutate({ mutation: LOGIN });
        await vi.waitFor(() => expect(isRequestFailed()).toBe(true));

        await stop();
        await listen(port, json({ data: { login: { __typename: "Auth", access_token: "T" } } }));
        retryFailedRequests();
        await expect(request).resolves.toBeDefined();
    });
});

describe("isNetworkFailure", () => {
    it("classification", () => {
        expect(isNetworkFailure(new TypeError("Failed to fetch"))).toBe(true);
        expect(isNetworkFailure(new CombinedGraphQLErrors({ data: null, errors: [{ message: "x" }] }))).toBe(false);
    });
});
