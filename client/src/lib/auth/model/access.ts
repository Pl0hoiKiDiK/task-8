import type { UserRole } from "./routes";

const matches = (pathname: string, base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

export function isAllowed(pathname: string, role: UserRole) {
    if (matches(pathname, "/admin")) return role === "Admin";
    if (matches(pathname, "/skills") || matches(pathname, "/languages")) return role === "Employee"
    return true;
}