import { describe, expect, it } from "vitest";
import { getRedirectPath } from "./access";

describe("getRedirectPath", () => {
    it("sends admin from employee pages to admin copies", () => {
        expect(getRedirectPath("/employees", "Admin")).toBe("/admin/employees");
        expect(getRedirectPath("/cvs/12/skills", "Admin")).toBe("/admin/cvs/12/skills");
    });
    it("keeps admin on admin pages", () => {
        expect(getRedirectPath("/admin/cvs", "Admin")).toBeNull();
    });
    it("keeps role-only pages closed", () => {
        expect(getRedirectPath("/admin/cvs", "Employee")).toBe("/employees");
        expect(getRedirectPath("/skills", "Admin")).toBe("/admin/employees");
        expect(getRedirectPath("/skills", "Employee")).toBeNull();
    });
});