import { describe, expect, it } from "vitest";
import { makeJwt } from "../test-utils";
import { decodeJwt, isJwtExpired } from "./jwt";

describe("decodeJwt", () => {
    it("reads claims from a valid token", () => {
        const claims = { sub: "1", email: "a@b.co", role: "Admin", exp: 1900000000 };
        expect(decodeJwt(makeJwt(claims))).toEqual(claims);
    });
    it("handles base64url chars and non-ASCII payload", () => {
        const claims = { sub: "1", email: "юзер+тест@пример.рф", role: "Employee", exp: 1 };
        expect(decodeJwt(makeJwt(claims))?.email).toBe(claims.email);
    });
    it("returns null for garbage", () => {
        expect(decodeJwt("")).toBeNull();
        expect(decodeJwt("abc")).toBeNull();
        expect(decodeJwt("a.%%%.c")).toBeNull();
        expect(decodeJwt("a.bm90IGpzb24.c")).toBeNull();
    });
    it("does not verify the signature", () => {
        const token = makeJwt({ sub: "1" }).replace("signature", "tampered");
        expect(decodeJwt(token)).not.toBeNull();
    });
});

describe("isJwtExpired", () => {
    const now = 1_000_000 * 1000;
    it("future exp → false, past exp → true, exp === now → true", () => {
        expect(isJwtExpired(makeJwt({ exp: 1_000_001 }), now)).toBe(false);
        expect(isJwtExpired(makeJwt({ exp: 999_999 }), now)).toBe(true);
        expect(isJwtExpired(makeJwt({ exp: 1_000_000 }), now)).toBe(true);
    });
    it("garbage / no exp / non-numeric exp - expired (fail closed)", () => {
        expect(isJwtExpired("garbage", now)).toBe(true);
        expect(isJwtExpired(makeJwt({ sub: "1" }), now)).toBe(true);
        expect(isJwtExpired(makeJwt({ exp: "9999999999" }), now)).toBe(true);
        expect(isJwtExpired(makeJwt(123), now)).toBe(true);
    });
});
