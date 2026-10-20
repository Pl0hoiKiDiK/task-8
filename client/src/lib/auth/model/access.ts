import { getHomePath, type UserRole } from "./routes";

const matches = (pathname: string, base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

const ADMIN_MIRRORED = ["/employees", "/cvs"]
const SHARED_ROUTES = [
    "/employees",
    "/employees/:id",
    "/employees/:id/(?:skills|languages|cvs)",
    "/cvs",
    "/cvs/:id",
    "/cvs/:id/(?:skills|projects|preview)",
    "/profile",
    "/profile/skills",
    "/profile/languages",
    "/settings",
]
const EMPLOYEE_ONLY_ROUTES = ["/skills", "/languages"]
const ADMIN_ONLY_ROUTES = ["/skills", "/languages", "/departments", "/positions", "/projects", "/profile/cvs", "/profile/cvs/:id"]

const toRegExp = (route: string) => new RegExp(`^${route.replace(/:id/g, "[^/]+")}$`)

const PRIVATE_ROUTES = [
    "/",
    ...SHARED_ROUTES,
    ...EMPLOYEE_ONLY_ROUTES,
    "/admin",
    ...[...SHARED_ROUTES, ...ADMIN_ONLY_ROUTES].map((route) => `/admin${route}`),
].map(toRegExp)

export function isPrivatePath(pathname: string): boolean {
    const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
    return PRIVATE_ROUTES.some((route) => route.test(normalized))
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
