import { UserLanguagesPreview, previewLanguages } from "@/components/user-languages-preview";

export default function ProfileLanguagesPage() {
  return <UserLanguagesPreview languages={previewLanguages} />;
}
