"use client";

import { useSignupForm } from "@/lib/auth/use-signup-form";
import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import Link from "next/link";


export default function SignUpPage() {
    const { values, errors, formError, loading, handleChange, handleSubmit } = useSignupForm();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setshowPasswordConfirm] = useState(false);

    return (
        <section className="signup-panel" aria-labelledby="sign-up-title">
            <h1 id="sign-up-title">Sign up now</h1>
            <p>Welcome! Sign up to continue</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="password-field">
                    <label className="sr-only" htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Email"
                        value={values.email}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email && <p id="email-error" role="alert" className="auth-error">{errors.email}</p>}
                </div>

                <div className="password-field">
                    <label className="sr-only" htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    <button
                        className="password-toggle"
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((visible) => !visible)}
                    >
                        <AppIcon name="eye" />
                    </button>
                    {errors.password && <p id="password-error" role="alert" className="auth-error">{errors.password}</p>}
                </div>

                <div className="password-field">
                    <label className="sr-only" htmlFor="confirmPassword">Confirm password</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswordConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Confirm password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.confirmPassword)}
                        aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    />
                    <button
                        className="password-toggle"
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        onClick={() => setshowPasswordConfirm((visible) => !visible)}
                    >
                        <AppIcon name="eye" />
                    </button>
                    {errors.confirmPassword && (
                        <p id="confirmPassword-error" role="alert" className="auth-error">{errors.confirmPassword}</p>
                    )}
                </div>

                {formError && <p role="alert" className="auth-form-error">{formError}</p>}

                <button className="primary-button primary-button-signup" type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create account"}
                </button>
                <Link className="auth-secondary-action" href="/">I have an account</Link>
            </form>
        </section> 
    );
}
