import { redirect } from "next/navigation";

export default async function AdminProfileCvDetailsRedirect({ params }: { params: Promise<{ cvId: string }> }) {
  const { cvId } = await params;
  redirect(`/admin/cvs/${encodeURIComponent(cvId)}`);
}
