"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
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
    const [errors, setErrors] = useState<LoginErrors>({});
    const [formError, setFormError] = useState<string | null>(null);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setValues((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
        setFormError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;

        const fieldErrors = validateLogin(values);
        setErrors(fieldErrors);
        setFormError(null);
        if (Object.keys(fieldErrors).length > 0) return;

        try {
            const { data } = await login({
                // the password is sent as typed: never trim it
                variables: { auth: { email: values.email.trim(), password: values.password } },
            });
            if (!data) throw new Error("Empty login response");

            startSession(data.login);
        } catch (error) {
            setFormError(getAuthErrorMessage(error));
        }
    }

    return { values, errors, formError, loading, handleChange, handleSubmit };
}