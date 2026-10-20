import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isRequestFailed, retryFailedRequests, waitForRetry } from "@/lib/system/network-status";
import { NoInternetGate } from "./no-internet-gate";
import { UnsupportedDevice } from "./unsupported-device";

const setOnline = (v: boolean) => Object.defineProperty(navigator, "onLine", { configurable: true, get: () => v });
afterEach(() => { act(() => retryFailedRequests()); setOnline(true); });

describe("NoInternetGate", () => {
    it("online: content is visible, error screen is not shown", () => {
        setOnline(true);
        render(<NoInternetGate><p>app</p></NoInternetGate>);
        expect(screen.getByText("app").closest("[hidden]")).toBeNull();
        expect(screen.queryByText("Oops")).toBeNull();
    });
    it("offline: error screen is shown. content is hidden, but NOT unmounted", () => {
        setOnline(false);
        render(<NoInternetGate><input aria-label="email" defaultValue="keep" /></NoInternetGate>);
        expect(screen.getByText("Oops")).toBeTruthy();
        expect(screen.queryByText(/go back/i)).toBeNull();
        const input = screen.getByLabelText("email", { selector: "input" }) as HTMLInputElement;
        expect(input.value).toBe("keep");
        expect(input.closest("[hidden]")).not.toBeNull();
    });
    it("failed request shows error screen. Retry hides it and releases pending request", async () => {
        setOnline(true);
        render(<NoInternetGate><p>app</p></NoInternetGate>);
        let released = false;
        act(() => { void waitForRetry().then(() => (released = true)); });
        expect(screen.getByText("Oops")).toBeTruthy();
        expect(isRequestFailed()).toBe(true);

        await act(async () => { fireEvent.click(screen.getByRole("button", { name: /retry/i })); });
        expect(released).toBe(true);
        expect(screen.queryByText("Oops")).toBeNull();
    });
});

describe("UnsupportedDevice", () => {
    it("hidden by the hidden attribute and shown by the max-md:block class", () => {
        const { container } = render(<UnsupportedDevice />);
        const wrapper = container.firstElementChild as HTMLElement;
        expect(wrapper.hasAttribute("hidden")).toBe(true);
        expect(wrapper.className).toContain("max-md:block");
    });
});
