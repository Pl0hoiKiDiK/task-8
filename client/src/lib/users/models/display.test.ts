import { describe, expect, it } from "vitest";
import { userFullName, userInitial } from "./display";

const user = (first: string | null, last: string | null, email = "z@x.co") =>
    ({ email, profile: { first_name: first, last_name: last, avatar: null } });

describe("display helpers", () => {
    it("полное имя", () => {
        expect(userFullName(user("Ann", "Lee"))).toBe("Ann Lee");
        expect(userFullName(user("Ann", null))).toBe("Ann");
        expect(userFullName(user(null, null))).toBe("");
    });
    it("инициал: имя -> фамилия -> email", () => {
        expect(userInitial(user("ann", "Lee"))).toBe("A");
        expect(userInitial(user(null, "lee"))).toBe("L");
        expect(userInitial(user(null, null, "zed@x.co"))).toBe("Z");
    });
});
