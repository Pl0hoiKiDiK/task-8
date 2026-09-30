import { UserLanguagesPreview } from "@/components/user-languages-preview";

export default async function AdminProfileLanguagesPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  return <UserLanguagesPreview role="admin" showExample={preview === "filled"} />;
}
