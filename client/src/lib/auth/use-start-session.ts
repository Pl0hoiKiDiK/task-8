"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks";
import { refreshTokenStorage, sessionStarted } from "@/lib/auth/auth-slice";
import type { AuthResult } from "@/lib/auth/graphql";

export function useStartSession() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    return useCallback(
        (result: AuthResult) => {
            refreshTokenStorage.set(result.refresh_token);
            dispatch(sessionStarted({ user: result.user, accessToken: result.access_token }));
            router.replace(result.user.role === "Admin" ? "/admin/employees" : "/employees");
        },
        [dispatch, router],
    );
}