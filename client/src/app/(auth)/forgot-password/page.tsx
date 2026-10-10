"use client";

import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { useForgotPasswordForm } from "@/lib/auth/hooks/use-forgot-password-form";

export default function ForgotPasswordPage() {
    const { email, emailError, formError, sentTo, loading, canSubmit, handleChange, handleBlur, handleSubmit } =
        useForgotPasswordForm();

    if (sentTo) {
        return (
            <section className="auth-panel" aria-labelledby="forgot-password-title">
                <h1 id="forgot-password-title">Check your email</h1>
                <p role="status">We sent password reset instructions to {sentTo}</p>
                <Link className="auth-secondary-action" href="/signin">Back to sign in</Link>
            </section>
        );
    }

    return (
        <section className="auth-panel" aria-labelledby="forgot-password-title">
            <h1 id="forgot-password-title">Forgot password</h1>
            <p>We will send you an email with further instructions</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

                {formError && <p role="alert" className="auth-form-error">{formError}</p>}

                <button className="primary-button primary-button-signup" type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Sending..." : "Reset password"}
                </button>
                <Link className="auth-secondary-action" href="/signin">Cancel</Link>
            </form>
        </section>
    );
}