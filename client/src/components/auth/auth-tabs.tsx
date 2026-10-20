"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
    { label: "Sign in", href: "/signin" },
    { label: "Sign up", href: "/signup" },
];

export function AuthTabs() {
    const pathname = usePathname();

    return (
        <nav className="flex h-14 shrink-0 justify-center" aria-label="Authentication">
            {tabs.map(({ label, href }) => {
                const active = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`grid w-[150px] place-items-center text-sm font-medium leading-[17.5px] tracking-[.4px] text-[var(--text)] uppercase no-underline${active ? " border-b-2 border-[var(--red)] font-semibold text-[var(--red)]" : ""}`}
                        aria-current={active ? "page" : undefined}
                    >
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}