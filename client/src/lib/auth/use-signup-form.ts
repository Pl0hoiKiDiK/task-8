"use client";

import { useState, type ChangeEvent, type FormEvent, type FocusEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { useAppDispatch } from "@/lib/hooks";
import { refreshTokenStorage, sessionStarted } from "@/lib/auth/auth-slice";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { SIGNUP_MUTATION } from "@/lib/auth/graphql";
import { validateSignup, type SignupErrors, type SignupValues } from "@/lib/auth/validation";

const EMPTY_VALUES: SignupValues = { email: "", password: "", confirmPassword: "" }

export function useSignupForm() {
    const dispatch = useAppDispatch();
    const [signup, { loading }] = useMutation(SIGNUP_MUTATION);

    const [values, setValues] = useState<SignupValues>(EMPTY_VALUES);
    const [touched, setTouched] = useState<Partial<Record<keyof SignupValues, boolean>>>({});
    const [formError, setFormError] = useState<string | null>(null);

    const validationErrors = validateSignup(values);
    const canSubmit = Object.keys(validationErrors).length === 0;

    const errors: SignupErrors = {}
    for (const field of Object.keys(validationErrors) as (keyof SignupValues)[]) {
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
            const { data } = await signup({
                variables: { auth: { ...values, email: values.email.trim() } },
            });
            if (!data) throw new Error("Empty signup response");

            const { access_token, refresh_token, user } = data.signup;
            refreshTokenStorage.set(refresh_token);
            dispatch(sessionStarted({ user, accessToken: access_token }));
        } catch (error) {
            setFormError(getAuthErrorMessage(error));
        }
    }

    return { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit };
}