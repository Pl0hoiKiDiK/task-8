"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { ProfileBreadcrumbs, ProfileTabs } from "@/components/profile-navigation";

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <label className="my-profile-field">
      <span>{label}</span>
      <input value={value} readOnly />
    </label>
  );
}

function ProfileSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="my-profile-field my-profile-field--select">
      <span>{label}</span>
      <div className="my-profile-select-value" aria-label={`${label}: ${value}`}>
        {value}
        <AppIcon name="chevron" className="my-profile-select-arrow" />
      </div>
    </div>
  );
}

export function MyProfilePreview({ role = "user" }: { role?: "user" | "admin" }) {
  const [toastVisible, setToastVisible] = useState(true);

  return (
    <AppShell title={<ProfileBreadcrumbs role={role} section="Profile" />} role={role} activeSection={role === "admin" ? "/admin/employees" : "/employees"} headerClassName="profile-header" showSettingsLink={role === "user"}>
      <div className="my-profile-page">
        <ProfileTabs role={role} section="Profile" />

        {toastVisible && (
          <div className="my-profile-toast" role="status">
            <div>
              <strong>Success</strong>
              <p>Description text<br />The second row text</p>
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => setToastVisible(false)}>
              <AppIcon name="cross-green" />
            </button>
          </div>
        )}

        <section className="my-profile-content" aria-label="My profile">
          <div className="my-profile-avatar-row">
            <div className="my-profile-avatar" aria-label="Profile avatar placeholder">R</div>
            <div className="my-profile-upload">
              <button type="button" disabled title="Avatar upload is not connected yet">
                <AppIcon name="download" className="my-profile-upload-icon" />
                <span>Upload avatar image</span>
              </button>
              <p>png, jpg or gif no more than 0.5MB</p>
            </div>
          </div>

          <div className="my-profile-identity">
            <h1>Rostislav Harlanov</h1>
            <p className="my-profile-email">thorn_pear@icloud.com</p>
            <p>A member since Sun Jan 14 2024</p>
          </div>

          <div className="my-profile-form">
            <ProfileField label="First Name" value="Rostislav" />
            <ProfileField label="Last Name" value="Harlanov" />
            <ProfileSelect label="Department" value="React" />
            <ProfileSelect label="Position" value="Software Engineer" />
            <div className="my-profile-actions">
              <button type="button" className="my-profile-verify" disabled title="Email verification is not connected yet">Verify email</button>
              <button type="button" className="my-profile-update" disabled title="Profile updates are not connected yet">Update</button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
