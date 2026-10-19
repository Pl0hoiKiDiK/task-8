import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { redirect } from "next/navigation";
import { isJwtExpired } from "@/lib/auth/model/jwt";

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string | string[] }>;
}) {
    const { token: raw } = await searchParams;
    const token = Array.isArray(raw) ? raw[0] : raw

    if (!token) redirect("/forgot-password")

    return <ResetPasswordForm token={isJwtExpired(token) ? undefined : token} />;
}