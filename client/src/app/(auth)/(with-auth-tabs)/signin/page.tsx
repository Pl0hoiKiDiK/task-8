"use client";

import { useLoginForm } from "@/lib/auth/hooks/use-login-form";
import { AuthField } from "@/components/auth/auth-field";

import Link from "next/link";

export default function SignInPage() {
  const { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit } = useLoginForm();

  return (
    <section className="mt-[clamp(100px,24.5vh,220px)] w-[min(560px,calc(100%_-_48px))] text-center max-[600px]:mt-[clamp(72px,20vh,190px)] [&>h1]:m-0 [&>h1]:text-[34px] [&>h1]:font-normal [&>h1]:leading-[42px] [&>h1]:tracking-[.25px] [&>p]:mt-5 [&>p]:mb-[42px] [&>p]:text-base [&>p]:leading-6 [&>p]:tracking-[.15px]" aria-labelledby="sign-in-title">
      <h1 id="sign-in-title">Welcome back</h1>
      <p>Hello again! Sign in to continue</p>

      <form className="flex flex-col items-center gap-9 [&>input]:h-12 [&>input]:w-full [&>input]:rounded-none [&>input]:border [&>input]:border-[#aeaeae] [&>input]:bg-transparent [&>input]:px-[11px] [&>input]:text-base [&>input]:leading-[23px] [&>input]:tracking-[.15px] [&>input]:text-[var(--text)] [&>input]:outline-offset-1 [&>input]:placeholder:text-[var(--placeholder)] [&>input:focus-visible]:border-[var(--text)] [&>input:focus-visible]:outline-none [&>input[aria-invalid=true]]:border-[var(--red)]" onSubmit={handleSubmit} noValidate>
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

        {formError && <p role="alert" className="-mt-6 mb-0 text-sm leading-5 tracking-[.25px] text-[var(--red)]">{formError}</p>}

        <button className="mt-2 h-12 w-40 rounded-3xl border-0 bg-[var(--red)] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[#f5f5f7] uppercase shadow-[0_2px_3px_#0003] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading || !canSubmit}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <Link href="/forgot-password">Forgot password?</Link>
      </form>
    </section>
  );
}
