"use client";

import { useLoginForm } from "@/lib/auth/use-login-form";
import { AuthField } from "@/components/auth/auth-field";

export default function SignInPage() {
  const { values, errors, formError, loading, handleChange, handleSubmit } = useLoginForm();

  return (
    <section className="auth-panel" aria-labelledby="sign-in-title">
      <h1 id="sign-in-title">Welcome back</h1>
      <p>Hello again! Sign in to continue</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />

        <AuthField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />

        {formError && <p role="alert" className="auth-form-error">{formError}</p>}

        <button className="primary-button" type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <span className="auth-secondary-action">Forgot password</span>
      </form>
    </section>
  );
}
