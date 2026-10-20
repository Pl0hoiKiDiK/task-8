import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { asGuest, asUser, makeStore, withStore } from "@/lib/auth/test-utils";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

import { GuestOnly } from "./guest-only";

const view = (store = makeStore()) => ({
    store,
    ...render(<GuestOnly><p>form</p></GuestOnly>, { wrapper: withStore(store) }),
});
beforeEach(() => replace.mockClear());

describe("GuestOnly", () => {
    it("while session is restoring - empty", () => {
        view();
        expect(screen.queryByText("form")).toBeNull();
        expect(replace).not.toHaveBeenCalled();
    });
    it("guest sees the form", () => {
        const store = makeStore(); asGuest(store);
        view(store);
        expect(screen.getByText("form")).toBeTruthy();
    });
    it("already authenticated user - redirect to home", () => {
        const store = makeStore(); asUser(store, "Admin");
        view(store);
        expect(screen.queryByText("form")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/admin/employees");
    });
    it("entering after page load: form remains", () => {
        const store = makeStore(); asGuest(store);
        view(store);
        act(() => asUser(store, "Employee"));
        expect(screen.getByText("form")).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });
});
