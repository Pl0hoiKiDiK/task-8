import { describe, expect, it } from "vitest";
import { makeJwt } from "@/lib/auth/test-utils";
import ResetPasswordPage from "./page";

const render = (token?: string | string[]) => ResetPasswordPage({ searchParams: Promise.resolve({ token }) });
const nowSec = () => Math.floor(Date.now() / 1000);

describe("ResetPasswordPage (server component)", () => {
    it("with no token - redirect to /forgot-password", async () => {
        await expect(render(undefined)).rejects.toMatchObject({ digest: expect.stringContaining("/forgot-password") });
    });
    it("with a valid token - passes the token to the form", async () => {
        const token = makeJwt({ email: "a@b.co", exp: nowSec() + 3600 });
        expect(((await render(token)) as any).props.token).toBe(token);
    });
    it("if the token is an array - the first token is used", async () => {
        const token = makeJwt({ email: "a@b.co", exp: nowSec() + 3600 });
        expect(((await render([token, "x"])) as any).props.token).toBe(token);
    });
    it.each([
        ["expired", () => makeJwt({ exp: nowSec() - 10 })],
        ["without exp", () => makeJwt({ email: "a@b.co" })],
        ["garbage", () => "not-a-jwt"],
    ])("%s token → form gets undefined (shows «link expired»)", async (_n, make) => {
        expect(((await render(make())) as any).props.token).toBeUndefined();
    });
});
