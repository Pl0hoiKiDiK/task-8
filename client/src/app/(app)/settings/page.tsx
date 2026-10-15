"use client";

import { useState, type FormEvent } from "react";
import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { AppIcon } from "@/components/app-icon";
import { CHANGE_PASSWORD_MUTATION } from "@/lib/auth/api/graphql";
import { getAuthErrorMessage } from "@/lib/auth/model/errors";
import { validateChangePassword, type ChangePasswordErrors, type ChangePasswordValues } from "@/lib/auth/model/validation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { languageOptions, setLanguage, setTheme, type LanguagePreference, type ThemePreference } from "@/lib/preferences-slice";

const emptyPasswords: ChangePasswordValues = { password: "", newPassword: "", confirmPassword: "" };
type PasswordKey = keyof ChangePasswordValues;

const passwordFields: { name: PasswordKey; label: string; autoComplete: string }[] = [
  { name: "password", label: "Password", autoComplete: "current-password" },
  { name: "newPassword", label: "New Password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm Password", autoComplete: "new-password" },
];

const serverFieldErrors: Record<string, { field: PasswordKey; message: string }> = {
  oldPasswordIncorrect: { field: "password", message: "Current password is incorrect" },
  oldPasswordIsRequired: { field: "password", message: "Password is required" },
  oldPasswordTooShort: { field: "password", message: "Password must be at least 6 characters long" },
  newPasswordIsRequired: { field: "newPassword", message: "New Password is required" },
  newPasswordTooShort: { field: "newPassword", message: "Password must be at least 6 characters long" },
  oldPasswordSameNewPassword: { field: "newPassword", message: "New password must be different from current password" },
  confirmPasswordIsRequired: { field: "confirmPassword", message: "Confirm Password is required" },
  confirmPasswordTooShort: { field: "confirmPassword", message: "Password must be at least 6 characters long" },
  confirmPasswordMismatch: { field: "confirmPassword", message: "Passwords do not match" },
};

function PasswordField({ name, label, autoComplete, value, error, onChange, onBlur }: {
  name: PasswordKey;
  label: string;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (name: PasswordKey, value: string) => void;
  onBlur: (name: PasswordKey) => void;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${name}-error`;

  return (
    <div className="relative mb-9">
      <label className="sr-only" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={label}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        onBlur={() => onBlur(name)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-12 w-full rounded-none border border-[#aeaeae] bg-transparent pl-3 pr-[52px] text-base leading-[23px] tracking-[0.15px] text-[var(--text)] placeholder:text-[var(--placeholder)] placeholder:opacity-100 hover:border-[var(--muted)] aria-invalid:border-[var(--red)]"
      />
      <button
        type="button"
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-0 right-2 grid h-12 w-10 place-items-center border-0 bg-transparent text-[var(--muted)] hover:text-[var(--text)]"
      >
        <AppIcon name="eye" />
      </button>
      {error && <p id={errorId} role="alert" className="mt-1 text-sm leading-5 text-[var(--red)]">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.preferences.theme);
  const language = useAppSelector((state) => state.preferences.language);
  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD_MUTATION);
  const [passwords, setPasswords] = useState<ChangePasswordValues>(emptyPasswords);
  const [touched, setTouched] = useState<Partial<Record<PasswordKey, boolean>>>({});
  const [requestFieldErrors, setRequestFieldErrors] = useState<ChangePasswordErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validationErrors = validateChangePassword(passwords);
  const canSubmit = Object.keys(validationErrors).length === 0;

  function changeField(name: PasswordKey, value: string) {
    setPasswords((current) => ({ ...current, [name]: value }));
    setRequestFieldErrors({});
    setRequestError(null);
    setSuccess(false);
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ password: true, newPassword: true, confirmPassword: true });
    if (!canSubmit || loading) return;

    setRequestFieldErrors({});
    setRequestError(null);
    setSuccess(false);

    try {
      const { data } = await changePassword({
        variables: {
          args: {
            oldPassword: passwords.password,
            newPassword: passwords.newPassword,
            confirmPassword: passwords.confirmPassword,
          },
        },
      });
      if (!data?.changePassword) {
        setRequestError("Something went wrong. Please try again.");
        return;
      }
      setPasswords(emptyPasswords);
      setTouched({});
      setSuccess(true);
    } catch (error) {
      const code = CombinedGraphQLErrors.is(error) ? error.errors[0]?.message : undefined;
      const fieldError = code ? serverFieldErrors[code] : undefined;
      if (fieldError) setRequestFieldErrors({ [fieldError.field]: fieldError.message });
      else setRequestError(getAuthErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[852px]">
      <label className="relative mb-5 block">
        <span className="block pl-3.5 text-xs leading-4 text-[var(--muted)]">Theme</span>
        <select value={theme} onChange={(event) => dispatch(setTheme(event.target.value as ThemePreference))} className="h-12 w-full appearance-none rounded-none border border-[#aeaeae] bg-[var(--surface)] pl-3 pr-10 text-base leading-6 tracking-[0.15px] text-[var(--text)]">
          <option value="system">Device settings</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <AppIcon name="chevron" className="pointer-events-none absolute right-3 bottom-3 -rotate-90" />
      </label>

      <label className="relative mb-5 block">
        <span className="block pl-3.5 text-xs leading-4 text-[var(--muted)]">Language</span>
        <select value={language} onChange={(event) => dispatch(setLanguage(event.target.value as LanguagePreference))} className="h-12 w-full appearance-none rounded-none border border-[#aeaeae] bg-[var(--surface)] pl-3 pr-10 text-base leading-6 tracking-[0.15px] text-[var(--text)]">
          {languageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <AppIcon name="chevron" className="pointer-events-none absolute right-3 bottom-3 -rotate-90" />
      </label>

      <section className="mt-9" aria-labelledby="change-password-title">
        <h1 id="change-password-title" className="mb-[26px] text-base font-normal leading-6 tracking-[0.15px]">Change password</h1>
        <form onSubmit={submitPassword} noValidate>
          {passwordFields.map(({ name, label, autoComplete }) => (
            <PasswordField
              key={name}
              name={name}
              label={label}
              autoComplete={autoComplete}
              value={passwords[name]}
              error={requestFieldErrors[name] ?? (touched[name] ? validationErrors[name] : undefined)}
              onChange={changeField}
              onBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
            />
          ))}
          {requestError && <p role="alert" className="mb-4 text-sm leading-5 text-[var(--red)]">{requestError}</p>}
          {success && <p role="status" className="mb-4 text-sm leading-5 text-[var(--text)]">Password changed successfully.</p>}
          <button
            className="ml-auto block h-12 w-40 rounded-full border-0 bg-[var(--red)] text-sm font-medium leading-[24.5px] tracking-[0.4px] text-[#f5f5f7] uppercase hover:brightness-90 active:brightness-75 disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:hover:brightness-100 disabled:active:brightness-100"
            type="submit"
            disabled={!canSubmit || loading}
          >
            {loading ? "Changing..." : "Change"}
          </button>
        </form>
      </section>
    </div>
  );
}
