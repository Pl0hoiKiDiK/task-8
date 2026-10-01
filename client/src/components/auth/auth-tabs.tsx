"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
    { label: "Sign in", href: "/" },
    { label: "Sign up", href: "/signup" },
];

export function AuthTabs() {
    const pathname = usePathname();

    return (
        <nav className="auth-tabs" aria-label="Authentication">
            {tabs.map(({ label, href }) => {
                const active = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`auth-tab${active ? " auth-tab--active" : ""}`}
                        aria-current={active ? "page" : undefined}
                    >
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}