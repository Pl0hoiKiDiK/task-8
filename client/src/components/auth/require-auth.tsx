"use client"

import { getRedirectPath, isPrivatePath } from "@/lib/auth/model/access";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";

const PUBLIC_PATHS = ["/signin", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export function RequireAuth({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { status, user } = useAppSelector((s) => s.auth)

    const isPublic =
        PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || !isPrivatePath(pathname);
    const ready = status === "ready"

    const redirectTo = user ? getRedirectPath(pathname, user.role) : null

    useEffect(() => {
        if (isPublic || !ready) return
        if (!user) router.replace("/signin")
        else if (redirectTo) router.replace(redirectTo)
    }, [isPublic, ready, user, redirectTo, router])

    if (isPublic) return <>{children}</>
    if (!ready || !user || redirectTo) return null
    return <>{children}</>
}