"use client";

import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { useResetPasswordForm } from "@/lib/auth/hooks/use-reset-password-form";

export function ResetPasswordForm({ token }: { token?: string }) {
    const { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit } =
        useResetPasswordForm(token);

    return (
        <section className="auth-panel" aria-labelledby="reset-password-title">
            <h1 id="reset-password-title">Reset password</h1>
            <p>Here you should write a new password and confirm it</p>

            {!token ? (
                <div className="auth-form">
                    <p role="alert" className="auth-error">LINK_EXPIRED_MESSAGE</p>
                </div>
            ) : (
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

                    <button className="primary-button primary-button-compact" type="submit" disabled={loading || !canSubmit}>
                        {loading ? "Saving..." : "Submit"}
                    </button>
                    <Link className="auth-secondary-action" href="/signin">Go to sign in</Link>
                </form>
            )}
        </section>
    );
}