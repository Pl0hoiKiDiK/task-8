"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useAppDispatch } from "@/lib/hooks";
import { refreshTokenStorage, sessionStarted } from "@/lib/auth/auth-slice";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { SIGNUP_MUTATION } from "@/lib/auth/graphql";
import { validateSignup, type SignupErrors, type SignupValues } from "@/lib/auth/validation";

const EMPTY_VALUES: SignupValues = { email: "", password: "", confirmPassword: "" }

export function useSignupForm() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [signup, { loading }] = useMutation(SIGNUP_MUTATION);

    const [values, setValues] = useState<SignupValues>(EMPTY_VALUES);
    const [errors, setErrors] = useState<SignupErrors>({});
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

        const fieldErrors = validateSignup(values);
        setErrors(fieldErrors);
        setFormError(null);
        if (Object.keys(fieldErrors).length > 0) return;

        try {
            const { data } = await signup({
                variables: { auth: { ...values, email: values.email.trim() } },
            });
            if (!data) throw new Error("Empty signup response");

            const { access_token, refresh_token, user } = data.signup;
            refreshTokenStorage.set(refresh_token);
            dispatch(sessionStarted({ user, accessToken: access_token }));
            router.replace("/employees");
        } catch (error) {
            setFormError(getAuthErrorMessage(error));
        }
    }

    return { values, errors, formError, loading, handleChange, handleSubmit };
}