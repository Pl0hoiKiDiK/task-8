import type { ReactNode } from "react";
import { AuthTabs } from "@/components/auth/auth-tabs";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <AuthTabs />
            {children}
        </>
    );
}