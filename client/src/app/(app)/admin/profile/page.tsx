import { MyProfilePreview } from "@/components/my-profile-preview";

export default async function AdminProfilePage({ searchParams }: { searchParams: Promise<{ userId?: string | string[] }> }) {
  const userId = (await searchParams).userId;
  return <MyProfilePreview userId={typeof userId === "string" ? userId : undefined} />;
}
