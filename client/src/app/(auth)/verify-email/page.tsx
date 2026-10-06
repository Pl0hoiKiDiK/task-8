"use client";

import { OtpField } from "@/components/auth/otp-field";
import { useVerifyEmailForm } from "@/lib/auth/hooks/use-verify-email-form";

export default function VerifyEmailPage() {
    const { digits, setDigits, error, loading, isReady, canSubmit, handleSubmit, handleLater } =
        useVerifyEmailForm();

    if (!isReady) return null;
    
    return (
        <section className="auth-panel auth-panel-verify" aria-labelledby="verify-email-title">
            <h1 id="verify-email-title">Email verification</h1>
            <p>Enter the verification code we sent to your email.</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <OtpField
                    value={digits}
                    onChange={setDigits}
                    readOnly={loading}
                    invalid={Boolean(error)}
                    describedBy={error ? "otp-error" : undefined}
                />

                {error && (
                    <p id="otp-error" role="alert" className="auth-form-error">
                        {error}
                    </p>
                )}

                <button className="primary-button" type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Confirming..." : "Confirm"}
                </button>
                <button className="auth-secondary-action" type="button" onClick={handleLater}>
                    Later
                </button>
            </form>
        </section>
    );
}