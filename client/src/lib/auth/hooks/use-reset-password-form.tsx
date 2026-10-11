"use client";

import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LOGIN_MUTATION, RESET_PASSWORD_MUTATION } from "@/lib/auth/api/graphql";
import { useStartSession } from "@/lib/auth/hooks/use-start-session";
import { getAuthErrorMessage } from "@/lib/auth/model/errors";
import { decodeJwt } from "../model/jwt";
import {
    validateResetPassword,
    type ResetPasswordErrors,
    type ResetPasswordValues,
} from "@/lib/auth/model/validation";

const EMPTY_VALUES: ResetPasswordValues = { newPassword: "", confirmPassword: "" };
const RESET_ERROR_OVERRIDES = {
    actionExpired: "This password reset link has expired",
};

export function useResetPasswordForm(token: string | undefined) {
    const router = useRouter();
    const startSession = useStartSession();
    const [reset, { loading: resetting }] = useMutation(RESET_PASSWORD_MUTATION);
    const [login, { loading: loggingIn }] = useMutation(LOGIN_MUTATION);

    const [values, setValues] = useState<ResetPasswordValues>(EMPTY_VALUES);
    const [touched, setTouched] = useState<Partial<Record<keyof ResetPasswordValues, boolean>>>({});
    const [formError, setFormError] = useState<string | null>(null);

    const loading = resetting || loggingIn;
    const validationErrors = validateResetPassword(values);
    const canSubmit = Object.keys(validationErrors).length === 0;

    const errors: ResetPasswordErrors = {};
    for (const field of Object.keys(validationErrors) as (keyof ResetPasswordValues)[]) {
        if (touched[field] && validationErrors[field]) errors[field] = validationErrors[field];
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setValues((current) => ({ ...current, [name]: value }));
        setFormError(null);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
        const { name } = event.target;
        setTouched((current) => ({ ...current, [name]: true }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading || !canSubmit || !token) return;

        setFormError(null);

        try {
            await reset({
                variables: { auth: values },
                context: { headers: { authorization: `Bearer ${token}` } },
            });
        } catch (error) {
            console.log(error);
            setFormError(getAuthErrorMessage(error, RESET_ERROR_OVERRIDES));
            return;
        }

        const email = decodeJwt(token)?.email
        if (!email) {
            router.replace("/signin");
            return;
        }
        try {
            const { data } = await login({ variables: { auth: { email, password: values.newPassword } } });
            if (!data) throw new Error("Empty login response");
            startSession(data.login);
        } catch {
            router.replace("/signin");
        }
    }

    return { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit };
}