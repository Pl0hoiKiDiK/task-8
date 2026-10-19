import { getHomePath, type UserRole } from "./routes";

const matches = (pathname: string, base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

const ADMIN_MIRRORED = ["/employees", "/cvs"]

const PRIVATE_BASES = ["/employees", "/cvs", "/profile", "/settings", "/skills", "/languages", "/admin"]

export function isPrivatePath(pathname: string): boolean {
    return pathname === "/" || PRIVATE_BASES.some((base) => matches(pathname, base))
}

export function getRedirectPath(pathname: string, role: UserRole): string | null {
    if (role === "Admin") {
        if (ADMIN_MIRRORED.some((base) => matches(pathname, base))) return `/admin${pathname}`
        if (matches(pathname, "/skills") || matches(pathname, "/languages")) return getHomePath(role)
        return null
    }
    if (matches(pathname, "/admin")) return getHomePath(role)
    return null
}