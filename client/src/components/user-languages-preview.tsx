import { AdminProfileActions } from "@/components/admin-profile-actions";
import { ProfileProficiencyItem, type ProficiencyTone } from "@/components/profile-proficiency-item";

export type ProfileLanguage = { name: string; tone: ProficiencyTone; level: number };

export const previewLanguages: ProfileLanguage[] = [
  { name: "Russian", tone: "red", level: 100 },
  { name: "English", tone: "green", level: 60 },
];

export function UserLanguagesPreview({ languages, canEdit = false }: { languages: ProfileLanguage[]; canEdit?: boolean }) {
  const hasLanguages = languages.length > 0;
  return (
    <div className={`user-languages-page${canEdit ? " user-languages-page--editable" : ""}`}>
      <section className={`user-skills-content user-languages-content${hasLanguages ? "" : " admin-profile-content--empty"}`} aria-label="Current languages">
        {hasLanguages ? (
          <div className="user-skills-group">
            <h1>Current languages</h1>
            <div className="user-skills-grid">
              {languages.map((language) => <ProfileProficiencyItem key={language.name} {...language} />)}
            </div>
          </div>
        ) : <h1 className="admin-profile-empty">No languages here</h1>}
        {canEdit && <AdminProfileActions item="language" />}
      </section>
    </div>
  );
}
