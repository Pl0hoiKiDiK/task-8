"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTheme, type ThemePreference } from "@/lib/preferences-slice";

function PasswordField({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="settings-password">
      <label className="sr-only" htmlFor={label}>{label}</label>
      <input id={label} type={visible ? "text" : "password"} placeholder={label} autoComplete={label === "Password" ? "current-password" : "new-password"} />
      <button type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} onClick={() => setVisible((value) => !value)}>
        <AppIcon name="eye" />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.preferences.theme);

  return (
    <>
      <div className="settings-layout">
        <label className="settings-select">
          <span>Theme</span>
          <select value={theme} onChange={(event) => dispatch(setTheme(event.target.value as ThemePreference))}>
            <option value="system">Device settings</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <AppIcon name="chevron" className="settings-select-arrow" />
        </label>

        <label className="settings-select">
          <span>Language</span>
          <select defaultValue="English">
            <option>English</option>
          </select>
          <AppIcon name="chevron" className="settings-select-arrow" />
        </label>

        <section className="settings-password-section" aria-labelledby="change-password-title">
          <h1 id="change-password-title">Change password</h1>
          <PasswordField label="Password" />
          <PasswordField label="New Password" />
          <PasswordField label="Confirm Password" />
          <button className="settings-submit" type="button" disabled>Change</button>
        </section>
      </div>
    </>
  );
}
