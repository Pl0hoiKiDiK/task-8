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
        <div className="relative w-full [&_input]:h-12 [&_input]:w-full [&_input]:rounded-none [&_input]:border [&_input]:border-[#aeaeae] [&_input]:bg-transparent [&_input]:pr-12 [&_input]:pl-[11px] [&_input]:text-base [&_input]:leading-[23px] [&_input]:tracking-[.15px] [&_input]:text-[var(--text)] [&_input]:outline-offset-1 [&_input]:placeholder:text-[var(--placeholder)] [&_input:focus-visible]:border-[var(--text)] [&_input:focus-visible]:outline-none [&_input[aria-invalid=true]]:border-[var(--red)]">
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
            />
            {isPassword && (
                <button
                    className="absolute top-0 right-2 grid h-12 w-10 place-items-center border-0 bg-transparent text-[var(--muted)]"
                    type="button"
                    aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    onClick={() => setVisible((v) => !v)}
                >
                    <AppIcon name="eye" />
                </button>
            )}
            {error && <p id={errorId} role="alert" className="mt-2 mb-0 text-sm leading-5 tracking-[.25px] text-[var(--red)]">{error}</p>}
        </div>
    );
}