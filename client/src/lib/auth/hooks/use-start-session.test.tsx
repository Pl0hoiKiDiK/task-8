import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore, withStore } from "../test-utils";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import { useSaveSession, useStartSession } from "./use-start-session";

const KEY = "cv-builder-refresh-token";
const store_ = new Map<string, string>();
const result = (role: "Admin" | "Employee", is_verified = true) => ({
    access_token: "ACCESS", refresh_token: "REFRESH", user: { id: "1", email: "a@b.co", role, is_verified },
});

beforeEach(() => {
    vi.clearAllMocks(); store_.clear();
    vi.stubGlobal("localStorage", {
        getItem: (k: string) => store_.get(k) ?? null,
        setItem: (k: string, v: string) => void store_.set(k, v),
        removeItem: (k: string) => void store_.delete(k),
    });
});
afterEach(() => vi.unstubAllGlobals());

describe("useSaveSession", () => {
    it("saves refresh token and puts user - access token in store, without redirect", () => {
        const store = makeStore();
        const { result: hook } = renderHook(() => useSaveSession(), { wrapper: withStore(store) });
        act(() => hook.current(result("Employee")));
        expect(store_.get(KEY)).toBe("REFRESH");
        expect(store.getState().auth).toMatchObject({ accessToken: "ACCESS", status: "ready", user: { id: "1", role: "Employee" } });
        expect(replace).not.toHaveBeenCalled();
    });
});

describe("useStartSession", () => {
    it.each([
        ["Employee", "/employees"],
        ["Admin", "/admin/employees"],
    ] as const)("role %s - redirect to %s", (role, path) => {
        const store = makeStore();
        const { result: hook } = renderHook(() => useStartSession(), { wrapper: withStore(store) });
        act(() => hook.current(result(role)));
        expect(store.getState().auth.user?.role).toBe(role);
        expect(store_.get(KEY)).toBe("REFRESH");
        expect(replace).toHaveBeenCalledWith(path);
    });
    it("session saves before redirect, otherwise redirect to /signin", () => {
        const store = makeStore();
        let userAtRedirect: unknown;
        replace.mockImplementation(() => { userAtRedirect = store.getState().auth.user; });
        const { result: hook } = renderHook(() => useStartSession(), { wrapper: withStore(store) });
        act(() => hook.current(result("Employee")));
        expect(userAtRedirect).not.toBeNull();
    });
});
