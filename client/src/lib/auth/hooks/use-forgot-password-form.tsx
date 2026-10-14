"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { FORGOT_PASSWORD_MUTATION } from "@/lib/auth/api/graphql";
import { getAuthErrorMessage } from "@/lib/auth/model/errors";
import { checkEmail } from "@/lib/auth/model/validation";

const FORGOT_ERROR_OVERRIDES = {
    failedToSendEmail: "No account found with this email address",
};

export function useForgotPasswordForm() {
    const [forgot, { loading }] = useMutation(FORGOT_PASSWORD_MUTATION);
    const [email, setEmail] = useState("");
    const [touched, setTouched] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);

    const validationError = checkEmail(email);
    const canSubmit = !validationError;
    const emailError = touched ? validationError : undefined;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setEmail(event.target.value);
        setFormError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading || !canSubmit) return;

        setFormError(null);
        try {
            await forgot({ variables: { auth: { email: email.trim() } } });
            setSentTo(email.trim());
        } catch (error) {
            setFormError(getAuthErrorMessage(error, FORGOT_ERROR_OVERRIDES));
        }
    }

    return {
        email, emailError, formError, sentTo, loading, canSubmit,
        handleChange, handleBlur: () => setTouched(true), handleSubmit,
    };
}