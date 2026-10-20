import { describe, expect, it } from "vitest";
import { emptyUserForm, validateUserForm, type UserFormFields } from "./user-form";

const valid: UserFormFields = {
    email: "a@b.co", password: "secret", firstName: "A", lastName: "B",
    departmentId: "1", positionId: "2", role: "Employee",
};

describe("validateUserForm (create)", () => {
    it("пустая форма: все поля обязательны, тексты из спеки", () => {
        expect(validateUserForm(emptyUserForm, "create")).toEqual({
            email: "Email is required",
            password: "Password is required",
            firstName: "First name is required",
            lastName: "Last name is required",
            departmentId: "Department is required",
            positionId: "Position is required",
        });
    });
    it("роль по умолчанию Employee (как в макете), без роли — ошибка", () => {
        expect(emptyUserForm.role).toBe("Employee");
        expect(validateUserForm({ ...emptyUserForm, role: "" }, "create").role).toBe("Role is required");
    });
    it("валидная форма без ошибок", () => {
        expect(validateUserForm(valid, "create")).toEqual({});
    });
    it("невалидный email", () => {
        expect(validateUserForm({ ...valid, email: "nope" }, "create").email).toBe("Invalid email address");
    });
    it("пароль короче 6 символов", () => {
        expect(validateUserForm({ ...valid, password: "12345" }, "create").password).toBe("Password must contain at least 6 characters");
        expect(validateUserForm({ ...valid, password: "123456" }, "create").password).toBeUndefined();
    });
    it("имя из одних пробелов считается пустым", () => {
        expect(validateUserForm({ ...valid, firstName: "   " }, "create").firstName).toBe("First name is required");
    });
});

describe("validateUserForm (update)", () => {
    it("email и пароль не проверяются", () => {
        expect(validateUserForm({ ...valid, email: "", password: "" }, "update")).toEqual({});
    });
    it("остальные поля по-прежнему обязательны", () => {
        expect(validateUserForm({ ...valid, role: "" }, "update")).toEqual({ role: "Role is required" });
    });
});
