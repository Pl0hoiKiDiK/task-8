"use client";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { getHomePath } from "@/lib/auth/model/routes";
import { ErrorScreen } from "@/components/system/error-screen";
import { SystemButton } from "@/components/system/system-button";

export default function NotFound() {
    const router = useRouter();
    const user = useAppSelector((s) => s.auth.user);
    const goBack = () =>
        window.history.length > 1 ? router.back() : router.replace(user ? getHomePath(user.role) : "/signin");

    return (
        <ErrorScreen title="Hmm..." action={<SystemButton onClick={goBack}>Go back</SystemButton>}>
            This doesn’t seem to be the page you were looking for.<br />
            Let’s get you back on track.
        </ErrorScreen>
    );
}