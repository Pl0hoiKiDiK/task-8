import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authReducer, emailVerified, refreshTokenStorage, restoreFinished, sessionCleared, sessionStarted } from "./auth-slice";

const user = { id: "1", email: "a@b.co", role: "Employee" as const, is_verified: false };
const initial = authReducer(undefined, { type: "@@init" });

describe("auth reducer", () => {
    it("starts in restoring state without a user", () => {
        expect(initial).toEqual({ user: null, accessToken: null, status: "restoring" });
    });
    it("sessionStarted stores user + token and becomes ready", () => {
        expect(authReducer(initial, sessionStarted({ user, accessToken: "t" })))
            .toEqual({ user, accessToken: "t", status: "ready" });
    });
    it("sessionCleared wipes the session", () => {
        const s = authReducer(initial, sessionStarted({ user, accessToken: "t" }));
        expect(authReducer(s, sessionCleared())).toEqual({ user: null, accessToken: null, status: "ready" });
    });
    it("restoreFinished only flips status", () => {
        expect(authReducer(initial, restoreFinished())).toEqual({ ...initial, status: "ready" });
    });
    it("emailVerified sets is_verified, and is a no-op without a user", () => {
        const s = authReducer(initial, sessionStarted({ user, accessToken: "t" }));
        expect(authReducer(s, emailVerified()).user?.is_verified).toBe(true);
        expect(authReducer(initial, emailVerified()).user).toBeNull();
    });
});

describe("refreshTokenStorage", () => {
    const store = new Map<string, string>();
    beforeEach(() => {
        store.clear();
        vi.stubGlobal("localStorage", {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => void store.set(k, v),
            removeItem: (k: string) => void store.delete(k),
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it("set/get/clear", () => {
        refreshTokenStorage.set("abc");
        expect(refreshTokenStorage.get()).toBe("abc");
        refreshTokenStorage.clear();
        expect(refreshTokenStorage.get()).toBeNull();
    });
    it("does not throw when localStorage is blocked", () => {
        vi.stubGlobal("localStorage", { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } });
        vi.spyOn(console, "warn").mockImplementation(() => { });
        vi.spyOn(console, "error").mockImplementation(() => { });
        expect(refreshTokenStorage.get()).toBeNull();
        expect(() => refreshTokenStorage.set("x")).not.toThrow();
        expect(() => refreshTokenStorage.clear()).not.toThrow();
    });
});
