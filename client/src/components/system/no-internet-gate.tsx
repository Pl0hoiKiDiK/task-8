"use client";

import { ReactNode } from "react";
import { useNoInternet } from "@/lib/system/network-status";
import { setRequestFailed } from "@/lib/system/network-status";
import { ErrorScreen } from "@/components/system/error-screen";
import { useApolloClient } from "@apollo/client/react/compiled";
import { SystemButton } from "./system-button";

export function NoInternetGate({ children }: { children: ReactNode }) {
    const client = useApolloClient();
    const noInternet = useNoInternet();
    const retry = () => { setRequestFailed(false); void client.refetchObservableQueries(); };

    return (
        <>
            <div hidden={noInternet}>{children}</div>
            {noInternet && (
                <ErrorScreen title="Oops" action={<SystemButton onClick={retry}>Retry</SystemButton>}>
                    Something went wrong. We’re already working on fixing it.<br />
                    Please try again or go back
                </ErrorScreen>
            )}
        </>
    );
}