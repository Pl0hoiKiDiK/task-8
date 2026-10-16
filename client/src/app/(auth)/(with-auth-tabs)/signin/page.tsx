"use client";

import { useLoginForm } from "@/lib/auth/hooks/use-login-form";
import { AuthField } from "@/components/auth/auth-field";
import { authCompactButton, authDescription, authForm, authFormError, authPanel, authSecondaryAction, authTitle } from "@/components/auth/auth-styles";

import Link from "next/link";

export default function SignInPage() {
  const { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit } = useLoginForm();

  return (
    <section className={authPanel} aria-labelledby="sign-in-title">
      <h1 id="sign-in-title" className={authTitle}>Welcome back</h1>
      <p className={authDescription}>Hello again! Sign in to continue</p>

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
          autoComplete="current-password"
          placeholder="Password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
        />

        {formError && <p role="alert" className={authFormError}>{formError}</p>}

        <button className={authCompactButton} type="submit" disabled={loading || !canSubmit}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <Link className={authSecondaryAction} href="/forgot-password">Forgot password?</Link>
      </form>
    </section>
  );
}
