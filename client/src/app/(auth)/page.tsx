"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { useLoginForm } from "@/lib/auth/use-login-form";

export default function SignInPage() {
  const { values, errors, formError, loading, handleChange, handleSubmit } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="auth-panel" aria-labelledby="sign-in-title">
      <h1 id="sign-in-title">Welcome back</h1>
      <p>Hello again! Sign in to continue</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="password-field">
          <label className="sr-only" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Password"
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
            autoComplete="current-password"
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

        {formError && <p role="alert" className="auth-form-error">{formError}</p>}

        <button className="primary-button" type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <span className="auth-secondary-action">Forgot password</span>
      </form>
    </section>
  );
}
