"use client";

import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { useResetPasswordForm } from "@/lib/auth/hooks/use-reset-password-form";

export function ResetPasswordForm({ token }: { token?: string }) {
    const { values, errors, formError, loading, passwordChanged, canSubmit, handleChange, handleBlur, handleSubmit } =
        useResetPasswordForm(token);

    if (passwordChanged) {
        return (
            <>
                <p role="status">Your password has been changed. Please sign in with your new password.</p>
                <Link className="mt-2 h-12 w-40 rounded-3xl border-0 bg-[var(--red)] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[#f5f5f7] uppercase shadow-[0_2px_3px_#0003] disabled:cursor-not-allowed disabled:opacity-60 primary-button-compact" href="/signin">Sign in</Link>
            </>
        );
    }

    return (
        <section className="mt-[clamp(100px,24.5vh,220px)] w-[min(560px,calc(100%_-_48px))] text-center max-[600px]:mt-[clamp(72px,20vh,190px)] [&>h1]:m-0 [&>h1]:text-[34px] [&>h1]:font-normal [&>h1]:leading-[42px] [&>h1]:tracking-[.25px] [&>p]:mt-5 [&>p]:mb-[42px] [&>p]:text-base [&>p]:leading-6 [&>p]:tracking-[.15px]" aria-labelledby="reset-password-title">
            <h1 id="reset-password-title">Reset password</h1>
            <p>Here you should write a new password and confirm it</p>

            {!token ? (
                <div className="flex flex-col items-center gap-9 [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[#aeaeae] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-base [&>input]:leading-[23px] [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:outline-offset-1 [&>input]:placeholder:text-[var(--placeholder)] [&>input:focus-visible]:border-[var(--text)] [&>input:focus-visible]:outline-none [&>input[aria-invalid=true]]:border-[var(--red)]">``
                    <p role="alert" className="mt-2 mb-0 text-sm leading-5 tracking-[.25px] text-[var(--red)]">LINK_EXPIRED_MESSAGE</p>
                </div>
            ) : (
                <form className="flex flex-col items-center gap-9 [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[#aeaeae] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-base [&>input]:leading-[23px] [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:outline-offset-1 [&>input]:placeholder:text-[var(--placeholder)] [&>input:focus-visible]:border-[var(--text)] [&>input:focus-visible]:outline-none [&>input[aria-invalid=true]]:border-[var(--red)]" onSubmit={handleSubmit} noValidate>
                    <AuthField
                        name="newPassword"
                        label="New password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="New password"
                        value={values.newPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.newPassword}
                    />

                    <AuthField
                        name="confirmPassword"
                        label="Confirm password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.confirmPassword}
                    />

                    {formError && <p role="alert" className="-mt-6 mb-0 text-sm leading-5 tracking-[.25px] text-[var(--red)]">{formError}</p>}

                    <button className="mt-2 h-12 w-40 rounded-3xl border-0 bg-[var(--red)] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[#f5f5f7] uppercase shadow-[0_2px_3px_#0003] disabled:cursor-not-allowed disabled:opacity-60 primary-button-compact" type="submit" disabled={loading || !canSubmit}>
                        {loading ? "Saving..." : "Submit"}
                    </button>
                    <Link className="-mt-4 text-sm font-medium leading-[24.5px] tracking-[.4px] text-[var(--muted)] uppercase" href="/signin">Go to sign in</Link>
                </form>
            )}
        </section>
    );
}