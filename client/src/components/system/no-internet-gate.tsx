"use client";

import { ReactNode } from "react";
import { ErrorScreen } from "@/components/system/error-screen";
import { SystemButton } from "./system-button";
import { retryFailedRequests, useNoInternet } from "@/lib/system/network-status";

export function NoInternetGate({ children }: { children: ReactNode }) {
    const noInternet = useNoInternet();

    function handleRetry() {
        const reload = retryFailedRequests();
        if (reload && navigator.onLine) window.location.reload();
    }

    return (
        <>
            <div hidden={noInternet}>{children}</div>
            {noInternet && (
                <ErrorScreen title="Oops" action={<SystemButton onClick={handleRetry}>Retry</SystemButton>}>
                    Something went wrong. We’re already working on fixing it.<br />
                    Please try again
                </ErrorScreen>
            )}
        </>
    );
}
