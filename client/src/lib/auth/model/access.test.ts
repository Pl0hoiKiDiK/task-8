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

    it("employee: /admin and nested paths are closed, similar names — no", () => {
        expect(getRedirectPath("/admin", "Employee")).toBe("/employees");
        expect(getRedirectPath("/admin/employees/5", "Employee")).toBe("/employees");
        expect(getRedirectPath("/administrator", "Employee")).toBeNull();
    });
    it("admin: similar prefixes are not considered mirrors", () => {
        expect(getRedirectPath("/employeesfoo", "Admin")).toBeNull();
        expect(getRedirectPath("/cvs-archive", "Admin")).toBeNull();
        expect(getRedirectPath("/skillset", "Admin")).toBeNull();
    });
    it("admin: /employees, /cvs → admin-copies (with nested paths)", () => {
        expect(getRedirectPath("/cvs", "Admin")).toBe("/admin/cvs");
        expect(getRedirectPath("/employees/7", "Admin")).toBe("/admin/employees/7");
    });
    it("admin: /languages и /skills → домашняя", () => {
        expect(getRedirectPath("/languages", "Admin")).toBe("/admin/employees");
        expect(getRedirectPath("/languages/1", "Admin")).toBe("/admin/employees");
    });
    it("employee: common pages are accessible", () => {
        for (const p of ["/employees", "/cvs/1", "/profile", "/settings", "/languages"])
            expect(getRedirectPath(p, "Employee")).toBeNull();
    });
    it("known space: /profile and /settings are not redirected for admins", () => {
        expect(getRedirectPath("/profile", "Admin")).toBeNull();
        expect(getRedirectPath("/settings", "Admin")).toBeNull();
    });
});