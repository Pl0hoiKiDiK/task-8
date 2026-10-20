import { render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authReducer, restoreFinished, sessionStarted } from "@/lib/auth/model/auth-slice";

const replace = vi.fn();
let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ replace }) }));

import { RequireAuth } from "./require-auth";

const mk = () => configureStore({ reducer: { auth: authReducer } });
const view = (store = mk()) =>
    render(<Provider store={store}><RequireAuth><p>secret</p></RequireAuth></Provider>);
const login = (store: ReturnType<typeof mk>, role: "Admin" | "Employee") =>
    store.dispatch(sessionStarted({ user: { id: "1", email: "a@b.co", role, is_verified: true }, accessToken: "t" }));

beforeEach(() => { replace.mockClear(); pathname = "/employees"; });

describe("RequireAuth", () => {
    it("while restoring: renders nothing, no redirect", () => {
        view();
        expect(screen.queryByText("secret")).toBeNull();
        expect(replace).not.toHaveBeenCalled();
    });
    it("guest on a private page → /signin, content hidden", () => {
        const store = mk(); store.dispatch(restoreFinished());
        view(store);
        expect(screen.queryByText("secret")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/signin");
    });
    it.each(["/signin", "/signup", "/forgot-password", "/reset-password", "/verify-email"])(
        "guest on public %s → content shown, no redirect", (p) => {
            pathname = p;
            const store = mk(); store.dispatch(restoreFinished());
            view(store);
            expect(screen.getByText("secret")).toBeTruthy();
            expect(replace).not.toHaveBeenCalled();
        });
    it("employee on own page → content", () => {
        const store = mk(); login(store, "Employee");
        view(store);
        expect(screen.getByText("secret")).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });
    it("employee on /admin/* → redirected home, content hidden", () => {
        pathname = "/admin/employees";
        const store = mk(); login(store, "Employee");
        view(store);
        expect(screen.queryByText("secret")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/employees");
    });
    it("admin on /employees → /admin/employees", () => {
        const store = mk(); login(store, "Admin");
        view(store);
        expect(screen.queryByText("secret")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/admin/employees");
    });
    it.each(["/signin-evil", "/no-such-page", "/employees-evil", "/admin-evil/x", "/profile/unknown", "/employees/1/unknown", "/admin/profile/unknown"])(
        "guest on unknown URL %s → 404 is public: content shown, no redirect to /signin", (p) => {
            pathname = p;
            const store = mk(); store.dispatch(restoreFinished());
            view(store);
            expect(screen.getByText("secret")).toBeTruthy();
            expect(replace).not.toHaveBeenCalled();
        });
    it("unknown URL while session is restoring → content (404) shown immediately", () => {
        pathname = "/no-such-page";
        view();
        expect(screen.getByText("secret")).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });
    it.each(["Employee", "Admin"] as const)("%s on unknown URL → 404 shown, no redirect", (role) => {
        pathname = "/no-such-page";
        const store = mk(); login(store, role);
        view(store);
        expect(screen.getByText("secret")).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });
    it.each(["/", "/employees", "/employees/5", "/cvs/3/skills", "/profile/languages", "/settings", "/skills", "/languages", "/admin", "/admin/profile/cvs"])(
        "guest on known private URL %s → /signin, content hidden", (p) => {
            pathname = p;
            const store = mk(); store.dispatch(restoreFinished());
            view(store);
            expect(screen.queryByText("secret")).toBeNull();
            expect(replace).toHaveBeenCalledWith("/signin");
        });
});
