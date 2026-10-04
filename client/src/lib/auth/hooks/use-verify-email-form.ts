"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { emailVerified } from "@/lib/auth/model/auth-slice";
import { getAuthErrorMessage } from "@/lib/auth/model/errors";
import { VERIFY_EMAIL_MUTATION } from "@/lib/auth/api/graphql";
import { getHomePath } from "@/lib/auth/model/routes";
import { OTP_LENGTH, isOtpComplete } from "@/lib/auth/model/validation";

export function useVerifyEmailForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [verify, { loading }] = useMutation(VERIFY_EMAIL_MUTATION);

    const [digits, setDigitsState] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
    const [error, setError] = useState<string | null>(null);

    const code = digits.join("");
    const canSubmit = isOtpComplete(code);

    useEffect(() => {
        if (!user) router.replace("/signin");
        else if (user.is_verified) router.replace(getHomePath(user.role));
    }, [user, router]);

    function setDigits(next: string[]) {
        setDigitsState(next);
        setError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading || !canSubmit) return;

        setError(null);

        try {
            await verify({ variables: { mail: { otp: code } } });
            dispatch(emailVerified());
        } catch (err) {
            setError(getAuthErrorMessage(err));
        }
    }

    function handleLater() {
        if (user) router.replace(getHomePath(user.role));
    }

    return { digits, setDigits, error, loading, canSubmit, handleSubmit, handleLater };
}