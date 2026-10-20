"use client";

import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { authDescription, authForm, authFormError, authPanel, authSecondaryAction, authTitle, authWideButton } from "@/components/auth/auth-styles";
import { useForgotPasswordForm } from "@/lib/auth/hooks/use-forgot-password-form";

export default function ForgotPasswordPage() {
    const { email, emailError, formError, sentTo, loading, canSubmit, handleChange, handleBlur, handleSubmit } =
        useForgotPasswordForm();

    if (sentTo) {
        return (
            <section className={authPanel} aria-labelledby="forgot-password-title">
                <h1 id="forgot-password-title" className={authTitle}>Check your email</h1>
                <p role="status" className={authDescription}>We sent password reset instructions to {sentTo}</p>
                <Link className={authSecondaryAction} href="/signin">Back to sign in</Link>
            </section>
        );
    }

    return (
        <section className={authPanel} aria-labelledby="forgot-password-title">
            <h1 id="forgot-password-title" className={authTitle}>Forgot password</h1>
            <p className={authDescription}>We will send you an email with further instructions</p>

            <form className={authForm} onSubmit={handleSubmit} noValidate>
                <AuthField
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={emailError}
                />

                {formError && <p role="alert" className={authFormError}>{formError}</p>}

                <button className={authWideButton} type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Sending..." : "Reset password"}
                </button>
                <Link className={authSecondaryAction} href="/signin">Cancel</Link>
            </form>
        </section>
    );
}
