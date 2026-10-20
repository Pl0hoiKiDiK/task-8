import type { ButtonHTMLAttributes } from "react";

export function SystemButton(props: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type">) {
    return (
        <button
            type="button"
            className="
            h-12 w-[13.75rem] max-w-full rounded-full
            bg-[var(--red)] px-5 text-sm font-medium
            uppercase text-white
            hover:brightness-110 active:brightness-90

            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[var(--red)]"
            {...props}
        />
    );
}