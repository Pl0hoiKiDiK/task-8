"use client";

import { OtpField } from "@/components/auth/otp-field";
import { useVerifyEmailForm } from "@/lib/auth/hooks/use-verify-email-form";

export default function VerifyEmailPage() {
    const { digits, setDigits, error, loading, isReady, canSubmit, handleSubmit, handleLater } =
        useVerifyEmailForm();

    if (!isReady) return null;
    
    return (
        <section className="mt-[clamp(100px,30.3vh,273px)] w-[min(560px,calc(100%_-_48px))] text-center [&>h1]:m-0 [&>h1]:text-[34px] [&>h1]:font-normal [&>h1]:leading-[42px] [&>h1]:tracking-[.25px] [&>p]:mt-5 [&>p]:mb-[42px] [&>p]:text-base [&>p]:leading-6 [&>p]:tracking-[.15px]" aria-labelledby="verify-email-title">
            <h1 id="verify-email-title">Email verification</h1>
            <p>Enter the verification code we sent to your email.</p>

            <form className="flex flex-col items-center gap-9 [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[#aeaeae] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-base [&>input]:leading-[23px] [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:outline-offset-1 [&>input]:placeholder:text-[var(--placeholder)] [&>input:focus-visible]:border-[var(--text)] [&>input:focus-visible]:outline-none [&>input[aria-invalid=true]]:border-[var(--red)]" onSubmit={handleSubmit} noValidate>
                <OtpField
                    value={digits}
                    onChange={setDigits}
                    readOnly={loading}
                    invalid={Boolean(error)}
                    describedBy={error ? "otp-error" : undefined}
                />

                {error && (
                    <p id="otp-error" role="alert" className="-mt-6 mb-0 text-sm leading-5 tracking-[.25px] text-[var(--red)]">
                        {error}
                    </p>
                )}

                <button className="mt-[5px] h-12 w-40 rounded-3xl border-0 bg-[var(--red)] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[#f5f5f7] uppercase shadow-[0_2px_3px_#0003] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Confirming..." : "Confirm"}
                </button>
                <button className="-mt-4 text-sm font-medium leading-[24.5px] tracking-[.4px] text-[var(--muted)] uppercase" type="button" onClick={handleLater}>
                    Later
                </button>
            </form>
        </section>
    );
}
