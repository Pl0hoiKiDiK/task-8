"use client";

import { useSignupForm } from "@/lib/auth/hooks/use-signup-form";
import { AuthField } from "@/components/auth/auth-field";
import { authDescription, authForm, authFormError, authSecondaryAction, authTitle, authWideButton, signupPanel } from "@/components/auth/auth-styles";
import Link from "next/link";


export default function SignUpPage() {
    const { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit } = useSignupForm();

    return (
        <section className={signupPanel} aria-labelledby="sign-up-title">
            <h1 id="sign-up-title" className={authTitle}>Sign up now</h1>
            <p className={authDescription}>Welcome! Sign up to continue</p>

            <form className={authForm} onSubmit={handleSubmit} noValidate>
                <AuthField
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                />

                <AuthField
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.password}
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

                <button className={authWideButton} type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Creating..." : "Create account"}
                </button>
                <Link className={authSecondaryAction} href="/signin">I have an account</Link>
            </form>
        </section>
    );
}
