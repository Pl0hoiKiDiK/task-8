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
        <div className="password-field">
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
                    className="password-toggle"
                    type="button"
                    aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    onClick={() => setVisible((v) => !v)}
                >
                    <AppIcon name="eye" />
                </button>
            )}
            {error && <p id={errorId} role="alert" className="auth-error">{error}</p>}
        </div>
    );
}