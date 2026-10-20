import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { decodeJwt } from "@/lib/auth/model/jwt";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string | string[] }>;
}) {
    const { token: raw } = await searchParams;
    const token = Array.isArray(raw) ? raw[0] : raw

    if (!token) redirect("/forgot-password")

    const claims = decodeJwt(token)
    // The reset link must be checked against the time of this request.
    // eslint-disable-next-line react-hooks/purity
    const isExpired = !claims || claims.exp * 1000 < Date.now();
    
    return <ResetPasswordForm token={isExpired ? undefined : token} />;
}
