import { describe, expect, it } from "vitest";
import { getHomePath, getStartPath } from "./routes";

const user = (role: "Admin" | "Employee", is_verified: boolean) => ({ id: "1", email: "a@b.co", role, is_verified });

describe("routes", () => {
    it("home path depends on role", () => {
        expect(getHomePath("Admin")).toBe("/admin/employees");
        expect(getHomePath("Employee")).toBe("/employees");
    });
    it("unverified user starts at /verify-email, verified at home", () => {
        expect(getStartPath(user("Employee", false))).toBe("/verify-email");
        expect(getStartPath(user("Admin", true))).toBe("/admin/employees");
    });
});
