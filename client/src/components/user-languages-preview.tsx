import { AppShell } from "@/components/app-shell";
import { AdminProfileActions } from "@/components/admin-profile-actions";
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
        <section className={`user-skills-content user-languages-content${showLanguages ? "" : " admin-profile-content--empty"}`} aria-label="Current languages">
          {showLanguages ? (
            <div className="user-skills-group">
              <h1>Current languages</h1>
              <div className="user-skills-grid">
                <ProfileProficiencyItem name="Russian" tone="red" level={100} />
                <ProfileProficiencyItem name="English" tone="green" level={60} />
              </div>
            </div>
          ) : <h1 className="admin-profile-empty">No languages here</h1>}
          {role === "admin" && <AdminProfileActions item="language" />}
        </section>
      </div>
    </AppShell>
  );
}
