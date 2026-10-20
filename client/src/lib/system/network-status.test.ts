import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRequestFailed, useNoInternet } from "./network-status";

const setOnline = (value: boolean) =>
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => value });

beforeEach(() => setOnline(true));
afterEach(() => {
    act(() => setRequestFailed(false));
    vi.restoreAllMocks();
});

describe("useNoInternet", () => {
    it("false when online and no failed request", () => {
        expect(renderHook(() => useNoInternet()).result.current).toBe(false);
    });
    it("true when the browser starts offline", () => {
        setOnline(false);
        expect(renderHook(() => useNoInternet()).result.current).toBe(true);
    });
    it("reacts to offline / online events", () => {
        const { result } = renderHook(() => useNoInternet());
        act(() => { setOnline(false); window.dispatchEvent(new Event("offline")); });
        expect(result.current).toBe(true);
        act(() => { setOnline(true); window.dispatchEvent(new Event("online")); });
        expect(result.current).toBe(false);
    });
    it("true after a failed request, false after reset (Retry)", () => {
        const { result } = renderHook(() => useNoInternet());
        act(() => setRequestFailed(true));
        expect(result.current).toBe(true);
        act(() => setRequestFailed(false));
        expect(result.current).toBe(false);
    });
    it("online event alone does NOT clear a failed-request flag (текущее поведение)", () => {
        const { result } = renderHook(() => useNoInternet());
        act(() => setRequestFailed(true));
        act(() => { window.dispatchEvent(new Event("online")); });
        expect(result.current).toBe(true);
    });
    it("unsubscribes on unmount", () => {
        const remove = vi.spyOn(window, "removeEventListener");
        renderHook(() => useNoInternet()).unmount();
        expect(remove).toHaveBeenCalledWith("online", expect.any(Function));
        expect(remove).toHaveBeenCalledWith("offline", expect.any(Function));
    });
});
