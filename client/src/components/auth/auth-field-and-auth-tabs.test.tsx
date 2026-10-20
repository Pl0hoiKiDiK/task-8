import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let pathname = "/signin";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { AuthField } from "./auth-field";
import { AuthTabs } from "./auth-tabs";

const props = { name: "password", label: "Password", value: "", onChange: vi.fn(), onBlur: vi.fn() };

describe("AuthField", () => {
    it("label with input", () => {
        render(<AuthField {...props} type="email" label="Email" name="email" />);
        expect((screen.getByLabelText("Email") as HTMLInputElement).type).toBe("email");
    });
    it("password: toggle shows/hides password and changes aria-pressed", () => {
        render(<AuthField {...props} type="password" />);
        const input = screen.getByLabelText("Password") as HTMLInputElement;
        const toggle = screen.getByRole("button", { name: "Show password" });
        expect(input.type).toBe("password");
        fireEvent.click(toggle);
        expect(input.type).toBe("text");
        expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");
    });
    it("non-password: eye-btn is not visible", () => {
        render(<AuthField {...props} type="text" />);
        expect(screen.queryByRole("button")).toBeNull();
    });
    it("error: role=alert, aria-invalid and aria-describedby are linked", () => {
        render(<AuthField {...props} error="Too short" />);
        const input = screen.getByLabelText("Password");
        expect(screen.getByRole("alert").textContent).toBe("Too short");
        expect(input.getAttribute("aria-invalid")).toBe("true");
        expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
    });
    it("without error: aria-invalid=false, no describedby", () => {
        render(<AuthField {...props} />);
        const input = screen.getByLabelText("Password");
        expect(input.getAttribute("aria-invalid")).toBe("false");
        expect(input.hasAttribute("aria-describedby")).toBe(false);
    });
    it("forwards onChange/onBlur", () => {
        const onChange = vi.fn(), onBlur = vi.fn();
        render(<AuthField {...props} onChange={onChange} onBlur={onBlur} />);
        const input = screen.getByLabelText("Password");
        fireEvent.change(input, { target: { value: "x" } }); fireEvent.blur(input);
        expect(onChange).toHaveBeenCalled(); expect(onBlur).toHaveBeenCalled();
    });
});

describe("AuthTabs", () => {
    it.each([["/signin", "Sign in", "Sign up"], ["/signup", "Sign up", "Sign in"]])(
        "on %s inactive tab «%s»", (path, active, other) => {
            pathname = path;
            render(<AuthTabs />);
            expect(screen.getByRole("link", { name: active }).getAttribute("aria-current")).toBe("page");
            expect(screen.getByRole("link", { name: other }).hasAttribute("aria-current")).toBe(false);
        });
    it("links leads to /signin and /signup", () => {
        render(<AuthTabs />);
        expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/signin");
        expect(screen.getByRole("link", { name: "Sign up" }).getAttribute("href")).toBe("/signup");
    });
});
