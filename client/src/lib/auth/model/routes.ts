import { AuthUser } from "./auth-slice";

export type UserRole = "Employee" | "Admin";

export function getHomePath(role: UserRole): string {
    return role === "Admin" ? "/admin/employees" : "/employees";
}

export function getStartPath(user: AuthUser): string {
    return user.is_verified ? getHomePath(user.role) : "/verify-email";
}