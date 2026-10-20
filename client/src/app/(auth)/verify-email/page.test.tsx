import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CombinedGraphQLErrors } from "@apollo/client";
import { asGuest, asUser, makeStore, withStore, type TestStore } from "@/lib/auth/test-utils";

const replace = vi.fn();
const verify = vi.fn();
const searchParams = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), useSearchParams: () => new URLSearchParams(searchParams.value) }));
vi.mock("@apollo/client/react", () => ({ useMutation: () => [verify, { loading: false }] }));

import VerifyEmailPage from "./page";

const view = (prepare: (s: TestStore) => void) => {
    const store = makeStore(); prepare(store);
    render(<VerifyEmailPage />, { wrapper: withStore(store) });
    return store;
};
const cell = (i: number) => screen.getByLabelText(`Digit ${i + 1} of 6`) as HTMLInputElement;
const confirm = () => screen.getByRole("button", { name: /confirm|confirming/i }) as HTMLButtonElement;
const paste = (code: string) => fireEvent.paste(cell(0), { clipboardData: { getData: () => code } });

beforeEach(() => { vi.clearAllMocks(); searchParams.value = ""; });

describe("VerifyEmailPage", () => {
    it("guest: page is empty, redirect to /signin", () => {
        view(asGuest);
        expect(screen.queryByText("Email verification")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/signin");
    });
    it("already verified: empty page and redirect to home", () => {
        view((s) => asUser(s, "Employee", true));
        expect(screen.queryByText("Email verification")).toBeNull();
        expect(replace).toHaveBeenCalledWith("/employees");
    });
    it("while session is restoring — empty, no redirect", () => {
        view(() => { });
        expect(screen.queryByText("Email verification")).toBeNull();
        expect(replace).not.toHaveBeenCalled();
    });
    it("unverified: 6 cells, Confirm is disabled until code is complete", () => {
        view((s) => asUser(s, "Employee", false));
        expect(screen.getByRole("heading", { name: "Email verification" })).toBeTruthy();
        expect(screen.getAllByLabelText(/Digit \d of 6/)).toHaveLength(6);
        expect(confirm().disabled).toBe(true);
        paste("12345");
        expect(confirm().disabled).toBe(true);
        paste("123456");
        expect(confirm().disabled).toBe(false);
    });
    it("shows confirmation when a verification email was sent", () => {
        searchParams.value = "sent=1";
        view((s) => asUser(s, "Employee", false));
        expect(screen.getByRole("status")).toHaveTextContent("Verification email sent");
    });
    it("correct code: request with 6 digits, user marked as verified, redirect to home", async () => {
        verify.mockResolvedValue({});
        const store = view((s) => asUser(s, "Employee", false));
        paste("123456");
        await userEvent.setup().click(confirm());
        await waitFor(() => expect(replace).toHaveBeenCalledWith("/employees"));
        expect(verify).toHaveBeenCalledWith({ variables: { mail: { otp: "123456" } } });
        expect(store.getState().auth.user?.is_verified).toBe(true);
    });
    it("incorrect code: alert «Invalid verification code», cells aria-invalid, without redirect; input clears the error", async () => {
        verify.mockRejectedValue(new CombinedGraphQLErrors({ data: null, errors: [{ message: "mailNotFound" }] }));
        view((s) => asUser(s, "Employee", false));
        paste("123456");
        await userEvent.setup().click(confirm());
        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toBe("Invalid verification code");
        expect(cell(0).getAttribute("aria-invalid")).toBe("true");
        expect(cell(0).getAttribute("aria-describedby")).toBe(alert.id);
        expect(replace).not.toHaveBeenCalled();
        paste("654321");
        expect(screen.queryByRole("alert")).toBeNull();
    });
    it("«Later» → home without verification (Admin → /admin/employees)", async () => {
        view((s) => asUser(s, "Admin", false));
        await userEvent.setup().click(screen.getByRole("button", { name: "Later" }));
        expect(replace).toHaveBeenCalledWith("/admin/employees");
        expect(verify).not.toHaveBeenCalled();
    });
});
