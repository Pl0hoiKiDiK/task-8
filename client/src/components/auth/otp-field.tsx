"use client";

import { useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";

type Props = {
    value: string[];
    onChange: (value: string[]) => void;
    readOnly?: boolean;
    invalid?: boolean;
    describedBy?: string;
};

export function OtpField({ value, onChange, readOnly, invalid, describedBy }: Props) {
    const length = value.length;
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    function focusCell(index: number) {
        refs.current[Math.min(Math.max(index, 0), length - 1)]?.focus();
    }

    function setCell(index: number, digit: string) {
        const next = [...value];
        next[index] = digit;
        onChange(next);
    }

    function fillFrom(index: number, digits: string) {
        const next = [...value];
        for (let i = 0; i < digits.length && index + i < length; i++) {
            next[index + i] = digits[i];
        }
        onChange(next);
        focusCell(index + digits.length);
    }

    function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
        const raw = event.target.value;
        if (raw === "") {
            setCell(index, "");
            return;
        }

        const digits = raw.replace(/\D/g, "");
        if (!digits) return;

        if (digits.length > 1 && !value[index]) {
            fillFrom(index, digits);
            return;
        }
        fillFrom(index, digits.slice(-1));
    }

    function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Backspace" && !value[index] && index > 0) {
            event.preventDefault();
            setCell(index - 1, "");
            focusCell(index - 1);
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            focusCell(index - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            focusCell(index + 1);
        }
    }

    function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const digits = event.clipboardData.getData("text").replace(/\D/g, "");
        if (!digits) return;

        if (digits.length >= length) fillFrom(0, digits.slice(0, length));
        else fillFrom(index, digits);
    }

    return (
        <div role="group" aria-label="Verification code" className="otp">
            {value.map((digit, index) => (
                <input
                    key={index}
                    ref={(element) => {
                        refs.current[index] = element;
                    }}
                    className="otp-cell"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1} of ${length}`}
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    value={digit}
                    readOnly={readOnly}
                    onChange={(event) => handleChange(index, event)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={(event) => handlePaste(index, event)}
                    onFocus={(event) => event.target.select()}
                />
            ))}
        </div>
    );
}