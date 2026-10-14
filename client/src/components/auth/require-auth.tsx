"use client"

import { getHomePath } from "@/lib/auth/model/routes";
import { isAllowed } from "@/lib/auth/model/access";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";

const PUBLIC_PATHS = ["/signin", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export function RequireAuth({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { status, user } = useAppSelector((s) => s.auth)

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const ready = status === "ready"
    const allowed = !!user && isAllowed(pathname, user.role)

    useEffect(() => {
        if (isPublic || !ready) return
        if (!user) router.replace("/signin")
        else if (!allowed) router.replace(getHomePath(user.role))
    }, [isPublic, ready, user, allowed, router])

    if (isPublic) return <>{children}</>
    if (!ready || !user || !allowed) return null
    return <>{children}</>
}