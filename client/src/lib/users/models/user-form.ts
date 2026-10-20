import type { UserRole } from "@/lib/auth/api/graphql";

export type UserFormFields = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    departmentId: string;
    positionId: string;
    role: UserRole | "";
};

export type UserFormErrors = Partial<Record<keyof UserFormFields, string>>;

export const emptyUserForm: UserFormFields = {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    departmentId: "",
    positionId: "",
    role: "Employee",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Правила из спеки Users. В режиме update email и password отключены и не проверяются. */
export function validateUserForm(fields: UserFormFields, mode: "create" | "update"): UserFormErrors {
    const errors: UserFormErrors = {};

    if (mode === "create") {
        if (!fields.email.trim()) errors.email = "Email is required";
        else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = "Invalid email address";

        if (!fields.password) errors.password = "Password is required";
        else if (fields.password.length < 6) errors.password = "Password must contain at least 6 characters";
    }

    if (!fields.firstName.trim()) errors.firstName = "First name is required";
    if (!fields.lastName.trim()) errors.lastName = "Last name is required";
    if (!fields.departmentId) errors.departmentId = "Department is required";
    if (!fields.positionId) errors.positionId = "Position is required";
    if (!fields.role) errors.role = "Role is required";

    return errors;
}
