"use client";

import { useState, type ChangeEvent, type FormEvent, type FocusEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { LOGIN_MUTATION } from "@/lib/auth/graphql";
import { useStartSession } from "@/lib/auth/use-start-session";
import { validateLogin, type LoginErrors, type LoginValues } from "@/lib/auth/validation";

const EMPTY_VALUES: LoginValues = { email: "", password: "" };

export function useLoginForm() {
    const startSession = useStartSession();
    const [login, { loading }] = useMutation(LOGIN_MUTATION);

    const [values, setValues] = useState<LoginValues>(EMPTY_VALUES);
    const [touched, setTouched] = useState<Partial<Record<keyof LoginValues, boolean>>>({});
    const [formError, setFormError] = useState<string | null>(null);

    const validationErrors = validateLogin(values);
    const canSubmit = Object.keys(validationErrors).length === 0;

    const errors: LoginErrors = {};
    for (const field of Object.keys(validationErrors) as (keyof LoginValues)[]) {
        if (touched[field] && validationErrors[field]) errors[field] = validationErrors[field]
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
        if (loading || !canSubmit) return;

        setFormError(null);

        try {
            const { data } = await login({
                variables: { auth: { email: values.email.trim(), password: values.password } },
            });
            if (!data) throw new Error("Empty login response");

            startSession(data.login);
        } catch (error) {
            setFormError(getAuthErrorMessage(error));
        }
    }
    return { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit };
}