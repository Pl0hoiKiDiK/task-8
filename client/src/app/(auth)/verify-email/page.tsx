"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OtpField } from "@/components/auth/otp-field";
import { authDescription, authForm, authFormError, authSecondaryAction, authTitle, authVerifyButton, verifyPanel } from "@/components/auth/auth-styles";
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
        <section className={verifyPanel} aria-labelledby="verify-email-title">
            <h1 id="verify-email-title" className={authTitle}>Email verification</h1>
            <Suspense fallback={null}><VerificationSentNotice /></Suspense>
            <p className={authDescription}>Enter the verification code we sent to your email.</p>

            <form className={authForm} onSubmit={handleSubmit} noValidate>
                <OtpField
                    value={digits}
                    onChange={setDigits}
                    readOnly={loading}
                    invalid={Boolean(error)}
                    describedBy={error ? "otp-error" : undefined}
                />

                {error && (
                    <p id="otp-error" role="alert" className={authFormError}>
                        {error}
                    </p>
                )}

                <button className={authVerifyButton} type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Confirming..." : "Confirm"}
                </button>
                <button className={authSecondaryAction} type="button" onClick={handleLater}>
                    Later
                </button>
            </form>
        </section>
    );
}
