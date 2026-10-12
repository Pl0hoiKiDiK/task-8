import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { decodeJwt } from "@/lib/auth/model/jwt";
import { redirect } from "next/dist/client/components/navigation";

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string | string[] }>;
}) {
    const { token: raw } = await searchParams;
    const token = Array.isArray(raw) ? raw[0] : raw

    if (!token) redirect("/forgot-password")

    const claims = decodeJwt(token)
    const isExpired = !claims || claims.exp * 1000 < Date.now();
    
    return <ResetPasswordForm token={isExpired ? undefined : token} />;
}