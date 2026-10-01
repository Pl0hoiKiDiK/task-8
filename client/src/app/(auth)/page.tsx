"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="auth-panel" aria-labelledby="sign-in-title">
        <h1 id="sign-in-title">Welcome back</h1>
        <p>Hello again! Sign in to continue</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="Email" />

          <div className="password-field">
            <label className="sr-only" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
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
          </div>

          <button className="primary-button" type="submit">Sign in</button>
          <span className="auth-secondary-action">Forgot password</span>
        </form>
      </section>
  );
}
