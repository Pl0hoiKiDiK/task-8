import type { ReactNode } from "react";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { GuestOnly } from "@/components/auth/guest-only";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <GuestOnly>
                <AuthTabs />
                {children}
            </GuestOnly>
        </>
    );
}
