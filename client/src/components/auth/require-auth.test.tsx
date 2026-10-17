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
    it("guest on a private page - /signin, content hidden", () => {
        const store = mk(); store.dispatch(restoreFinished());
        view(store);
        expect(screen.queryByText("secret")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/signin");
    });
    it.each(["/signin", "/signup", "/forgot-password", "/reset-password", "/verify-email"])(
        "guest on public %s - content shown, no redirect", (p) => {
            pathname = p;
            const store = mk(); store.dispatch(restoreFinished());
            view(store);
            expect(screen.getByText("secret")).toBeTruthy();
            expect(replace).not.toHaveBeenCalled();
        });
    it("employee on own page - content", () => {
        const store = mk(); login(store, "Employee");
        view(store);
        expect(screen.getByText("secret")).toBeTruthy();
        expect(replace).not.toHaveBeenCalled();
    });
    it("employee on /admin/* - redirected home, content hidden", () => {
        pathname = "/admin/employees";
        const store = mk(); login(store, "Employee");
        view(store);
        expect(screen.queryByText("secret")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/employees");
    });
    it("admin on /employees - redirected to /admin/employees", () => {
        const store = mk(); login(store, "Admin");
        view(store);
        expect(screen.queryByText("secret")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/admin/employees");
    });
    it("public-path prefix is not a loophole: /signin-evil is private", () => {
        pathname = "/signin-evil";
        const store = mk(); store.dispatch(restoreFinished());
        view(store);
        expect(replace).toHaveBeenCalledWith("/signin");
    });
});
