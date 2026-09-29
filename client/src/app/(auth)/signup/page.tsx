"use client";

import { useSignupForm } from "@/lib/auth/use-signup-form";

export default function SignUpPage() {
    const { values, errors, formError, loading, handleChange, handleSubmit } = useSignupForm();

    return (
        <section className="auth-panel" aria-labelledby="sign-up-title">
            <h1 id="sign-up-title">Create account</h1>
            <p>Join us! Fill in the details to register</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
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

                <label className="sr-only" htmlFor="password">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Password"
                    value={values.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                />
                {errors.password && <p id="password-error" role="alert" className="auth-error">{errors.password}</p>}

                <label className="sr-only" htmlFor="confirmPassword">Confirm password</label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                />
                {errors.confirmPassword && (
                    <p id="confirmPassword-error" role="alert" className="auth-error">{errors.confirmPassword}</p>
                )}

                {formError && <p role="alert" className="auth-form-error">{formError}</p>}

                <button className="primary-button" type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Sign up"}
                </button>
            </form>
        </section>
    );
}
