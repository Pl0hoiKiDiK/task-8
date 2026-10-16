"use client"

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";

type AuthFieldProps = {
    name: string,
    label: string,
    type?: "text" | "email" | "password",
    autoComplete?: string,
    placeholder?: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void,
    error?: string,
}

export function AuthField({ name, label, type = "text", autoComplete, placeholder, value, onChange, onBlur, error }: AuthFieldProps) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const errorId = `${name}-error`;

    return (
        <div className="relative w-full">
            <label className="sr-only" htmlFor={name}>{label}</label>
            <input
                id={name}
                name={name}
                type={isPassword && visible ? "text" : type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={`h-12 w-full rounded-none border bg-transparent px-[11px] text-base leading-[23px] tracking-[.15px] text-[var(--text)] placeholder:text-[var(--placeholder)] focus-visible:border-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)] aria-invalid:border-[var(--red)] ${isPassword ? "pr-12" : ""} border-[#aeaeae]`}
            />
            {isPassword && (
                <button
                    className="absolute inset-y-0 right-2 grid w-10 place-items-center border-0 bg-transparent text-[var(--muted)] hover:text-[var(--text)]"
                    type="button"
                    aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    onClick={() => setVisible((v) => !v)}
                >
                    <AppIcon name="eye" className="size-6" />
                </button>
            )}
            {error && <p id={errorId} role="alert" className="mt-2 text-sm leading-5 tracking-[.25px] text-[var(--red)]">{error}</p>}
        </div>
    );
}
