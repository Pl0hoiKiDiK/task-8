import type { UserRole } from "@/lib/auth/api/graphql";

type JwtClaims = { sub: string; email: string; role: UserRole; exp: number };

export function decodeJwt(token: string): JwtClaims | null {
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}