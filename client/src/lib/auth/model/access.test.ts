import { describe, expect, it } from "vitest";
import { getRedirectPath, isPrivatePath } from "./access";

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


describe("isPrivatePath", () => {
    it.each(["/", "/employees", "/employees/12", "/cvs", "/cvs/1/skills", "/profile", "/profile/skills", "/settings", "/skills", "/languages", "/admin", "/admin/employees", "/admin/cvs/1/projects", "/admin/profile/cvs/7", "/admin/departments", "/employees/"])(
        "%s — закрытый раздел", (p) => expect(isPrivatePath(p)).toBe(true));
    it.each(["/no-such-page", "/employees-evil", "/admin-panel", "/signin", "/foo/employees", "/Employees",
        "/profile/unknown", "/profile/skills/x", "/employees/1/unknown", "/cvs/1/unknown", "/settings/x", "/admin/unknown", "/admin/profile/unknown", "/projects", "/departments"])(
            "%s — неизвестный URL (404) / не закрытый раздел", (p) => expect(isPrivatePath(p)).toBe(false));
});
