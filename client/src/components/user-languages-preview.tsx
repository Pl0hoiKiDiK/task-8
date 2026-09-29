import { AppShell } from "@/components/app-shell";
import { ProfileBreadcrumbs, ProfileTabs } from "@/components/profile-navigation";
import { ProfileProficiencyItem } from "@/components/profile-proficiency-item";

export function UserLanguagesPreview({ role = "user" }: { role?: "user" | "admin" }) {
  return (
    <AppShell
      title={<ProfileBreadcrumbs role={role} section="Languages" />}
      role={role}
      activeSection={role === "admin" ? "/admin/employees" : "/employees"}
      headerClassName="profile-header"
      showSettingsLink={role === "user"}
    >
      <div className="user-languages-page">
        <ProfileTabs role={role} section="Languages" />
        <section className="user-skills-content user-languages-content" aria-label="Current languages">
          <div className="user-skills-group">
            <h1>Current languages</h1>
            <div className="user-skills-grid">
              <ProfileProficiencyItem name="Russian" tone="red" level={100} />
              <ProfileProficiencyItem name="English" tone="green" level={60} />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
