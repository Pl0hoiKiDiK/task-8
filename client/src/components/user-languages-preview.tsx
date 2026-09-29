import { AppShell } from "@/components/app-shell";
import { AppIcon } from "@/components/app-icon";
import { ProfileBreadcrumbs, ProfileTabs } from "@/components/profile-navigation";
import { ProfileProficiencyItem } from "@/components/profile-proficiency-item";

export function UserLanguagesPreview({ role = "user", showExample = false }: { role?: "user" | "admin"; showExample?: boolean }) {
  const showLanguages = role === "user" || showExample;

  return (
    <AppShell
      title={<ProfileBreadcrumbs role={role} section="Languages" />}
      role={role}
      activeSection={role === "admin" ? "/admin/employees" : "/employees"}
      headerClassName="profile-header"
      showSettingsLink={role === "user"}
    >
      <div className={`user-languages-page${role === "admin" ? " user-languages-page--admin" : ""}`}>
        <ProfileTabs role={role} section="Languages" />
        <section className={`user-skills-content user-languages-content${showLanguages ? "" : " user-languages-content--empty"}`} aria-label="Current languages">
          {showLanguages ? (
            <div className="user-skills-group">
              <h1>Current languages</h1>
              <div className="user-skills-grid">
                <ProfileProficiencyItem name="Russian" tone="red" level={100} />
                <ProfileProficiencyItem name="English" tone="green" level={60} />
              </div>
            </div>
          ) : <h1 className="admin-languages-empty">No languages here</h1>}
          {role === "admin" && (
            <div className="admin-languages-actions">
              <button type="button" disabled title="Language editing is not connected yet"><AppIcon name="add-language" />Add language</button>
              <button type="button" disabled title="Language editing is not connected yet"><AppIcon name="delete" />Remove languages</button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
