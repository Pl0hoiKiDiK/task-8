import type { ReactNode } from "react";
import { SadMonitorIcon } from "./sad-monitor-icon";

export function ErrorScreen({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[var(--background)] p-6 text-center text-[var(--text)]">
            <SadMonitorIcon className="h-auto w-40 text-[var(--text)]" />
            {title && <h1 className="text-[2.125rem] leading-[1.235] font-normal">{title}</h1>}
            <p className="max-w-[35rem] text-base leading-normal">{children}</p>
            {action}
        </main>
    );
}