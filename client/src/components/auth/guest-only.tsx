"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { getHomePath } from "@/lib/auth/model/routes";

export function GuestOnly({ children }: { children: ReactNode }) {
    const router = useRouter();
    const status = useAppSelector((state) => state.auth.status);
    const user = useAppSelector((state) => state.auth.user);

    const [wasAuthenticated, setWasAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        if (status === "ready" && wasAuthenticated === null) {
            setWasAuthenticated(user !== null);
        }
    }, [status, user, wasAuthenticated]);

    useEffect(() => {
        if (wasAuthenticated && user) router.replace(getHomePath(user.role));
    }, [wasAuthenticated, user, router]);

    if (status !== "ready" || wasAuthenticated === null || wasAuthenticated) return null;

    return <>{children}</>;
}