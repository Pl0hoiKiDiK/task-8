"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks";
import { refreshTokenStorage, sessionStarted } from "@/lib/auth/model/auth-slice";
import type { AuthResult } from "@/lib/auth/api/graphql";
import { getHomePath } from "@/lib/auth/model/routes";

export function useSaveSession() {
    const dispatch = useAppDispatch();

    return useCallback(
        (result: AuthResult) => {
            refreshTokenStorage.set(result.refresh_token);
            dispatch(sessionStarted({ user: result.user, accessToken: result.access_token }));
        },
        [dispatch],
    );
}

export function useStartSession() {
    const router = useRouter();
    const saveSession = useSaveSession();

    return useCallback(
        (result: AuthResult) => {
            saveSession(result);
            router.replace(getHomePath(result.user.role));
        },
        [saveSession, router],
    );
}