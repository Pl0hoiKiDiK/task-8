export type UserRole = "Employee" | "Admin";

export function getHomePath(role: UserRole): string {
    return role === "Admin" ? "/admin/employees" : "/employees";
}