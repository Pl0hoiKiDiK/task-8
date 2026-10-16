"use client";

import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { authCompactButton, authDescription, authForm, authFormError, authSecondaryAction, authTitle, resetPanel } from "@/components/auth/auth-styles";
import { useResetPasswordForm } from "@/lib/auth/hooks/use-reset-password-form";

export function ResetPasswordForm({ token }: { token?: string }) {
    const { values, errors, formError, loading, passwordChanged, canSubmit, handleChange, handleBlur, handleSubmit } =
        useResetPasswordForm(token);

    if (passwordChanged) {
        return (
            <section className={resetPanel}>
                <p role="status" className={authDescription}>Your password has been changed. Please sign in with your new password.</p>
                <Link className={`${authCompactButton} mx-auto`} href="/signin">Sign in</Link>
            </section>
        );
    }

    return (
        <section className={resetPanel} aria-labelledby="reset-password-title">
            <h1 id="reset-password-title" className={authTitle}>Reset password</h1>
            <p className={authDescription}>Here you should write a new password and confirm it</p>

            {!token ? (
                <div className={authForm}>
                    <p role="alert" className="text-sm leading-5 text-[var(--red)]">This password reset link has expired</p>
                    <Link className={authSecondaryAction} href="/signin">Go to sign in</Link>
                </div>
            ) : (
                <form className={authForm} onSubmit={handleSubmit} noValidate>
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

                    {formError && <p role="alert" className={authFormError}>{formError}</p>}

                    <button className={authCompactButton} type="submit" disabled={loading || !canSubmit}>
                        {loading ? "Saving..." : "Submit"}
                    </button>
                    <Link className={authSecondaryAction} href="/signin">Go to sign in</Link>
                </form>
            )}
        </section>
    );
}
