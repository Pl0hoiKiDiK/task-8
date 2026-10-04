"use client";

import { useState, type ChangeEvent, type FormEvent, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { useSaveSession } from "@/lib/auth/hooks/use-start-session";
import { useMutation } from "@apollo/client/react";
import { getAuthErrorMessage } from "@/lib/auth/model/errors";
import { SIGNUP_MUTATION } from "@/lib/auth/api/graphql";
import { validateSignup, type SignupErrors, type SignupValues } from "@/lib/auth/model/validation";

const EMPTY_VALUES: SignupValues = { email: "", password: "", confirmPassword: "" }

export function useSignupForm() {
    const saveSession = useSaveSession();
    const router = useRouter();

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

            saveSession(data.signup);
            router.replace("/verify-email");
        } catch (error) {
            setFormError(getAuthErrorMessage(error));
        }
    }

    return { values, errors, formError, loading, canSubmit, handleChange, handleBlur, handleSubmit };
}