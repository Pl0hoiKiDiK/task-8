"use client";

import { useSignupForm } from "@/lib/auth/hooks/use-signup-form";
import { AuthField } from "@/components/auth/auth-field";
import Link from "next/link";


export default function SignUpPage() {
    const { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit } = useSignupForm();

    return (
        <section className="mt-[clamp(64px,20vh,180px)] w-[min(560px,calc(100%_-_48px))] text-center max-[900px]:mt-[clamp(110px,20vh,180px)] [&>h1]:m-0 [&>h1]:text-[34px] [&>h1]:font-normal [&>h1]:leading-[42px] [&>h1]:tracking-[.25px] [&>p]:mt-5 [&>p]:mb-[42px] [&>p]:text-base [&>p]:leading-6 [&>p]:tracking-[.15px]" aria-labelledby="sign-up-title">
            <h1 id="sign-up-title">Sign up now</h1>
            <p>Welcome! Sign up to continue</p>

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

                {formError && <p role="alert" className="-mt-6 mb-0 text-sm leading-5 tracking-[.25px] text-[var(--red)]">{formError}</p>}

                <button className="mt-2 h-12 w-40 rounded-3xl border-0 bg-[var(--red)] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[#f5f5f7] uppercase shadow-[0_2px_3px_#0003] disabled:cursor-not-allowed disabled:opacity-60 w-[220px]" type="submit" disabled={loading || !canSubmit}>
                    {loading ? "Creating..." : "Create account"}
                </button>
                <Link className="-mt-4 text-sm font-medium leading-[24.5px] tracking-[.4px] text-[var(--muted)] uppercase" href="/signin">I have an account</Link>
            </form>
        </section>
    );
}
