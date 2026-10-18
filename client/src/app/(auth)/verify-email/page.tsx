"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OtpField } from "@/components/auth/otp-field";
import { useVerifyEmailForm } from "@/lib/auth/hooks/use-verify-email-form";

function VerificationSentNotice() {
    const sent = useSearchParams().get("sent") === "1";
    return sent ? <p role="status">Verification email sent. Check your inbox for the code.</p> : null;
}

export default function VerifyEmailPage() {
    const { digits, setDigits, error, loading, isReady, canSubmit, handleSubmit, handleLater } =
        useVerifyEmailForm();

    if (!isReady) return null;
    
    return (
        <section className="auth-panel auth-panel-verify" aria-labelledby="verify-email-title">
            <h1 id="verify-email-title">Email verification</h1>
            <Suspense fallback={null}><VerificationSentNotice /></Suspense>
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
