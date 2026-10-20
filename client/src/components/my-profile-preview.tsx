"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { AppIcon } from "@/components/app-icon";
import { useAppSelector } from "@/lib/hooks";
import type { AuthUser } from "@/lib/auth/model/auth-slice";
import { getAuthErrorMessage } from "@/lib/auth/model/errors";
import { DELETE_AVATAR } from "@/lib/cv-api";
import { PROFILE_USER_QUERY, loadCatalogs, UPDATE_PROFILE_MUTATION, UPDATE_PROFILE_USER_MUTATION, UPLOAD_PROFILE_AVATAR_MUTATION, SEND_PROFILE_VERIFICATION_MUTATION, type CatalogItem, type ProfileUser } from "@/lib/profile/api";

const avatarLimit = 500_000;
const imageTypes = new Set(["image/png", "image/jpeg", "image/gif"]);
const control = "h-12 w-full rounded-none border border-[#aeaeae] bg-transparent px-3 text-base leading-6 text-[var(--text)] outline-none focus-visible:border-[var(--red)] focus-visible:ring-2 focus-visible:ring-[var(--red)] aria-invalid:border-[var(--red)]";
const action = "h-12 w-40 rounded-full text-sm font-medium uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)] disabled:cursor-not-allowed disabled:opacity-50";
type Draft = { first: string; last: string; departmentId: string; positionId: string };
const blank: Draft = { first: "", last: "", departmentId: "", positionId: "" };
const fromUser = (user: ProfileUser): Draft => ({ first: user.profile.first_name ?? "", last: user.profile.last_name ?? "", departmentId: user.department?.id ?? "", positionId: user.position?.id ?? "" });
const nameError = (value: string, label: string) => !value.trim() ? `${label} is required` : value.trim().length > 100 ? `${label} must be 100 characters or less` : "";

function ProfileInput({ label, value, onChange, onBlur, readOnly, error }: { label: string; value: string; onChange: (value: string) => void; onBlur: () => void; readOnly: boolean; error: string }) {
  const id = `profile-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div className="min-w-0"><label htmlFor={id} className="block pl-4 text-xs leading-4 text-[var(--muted)]">{label}</label>
    <input id={id} className={control} value={value} maxLength={101} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
    {error && <p id={`${id}-error`} className="mt-1 text-sm text-[var(--red)]" role="alert">{error}</p>}</div>;
}

function ProfileSelect({ label, value, options, onChange, onBlur, disabled, error }: { label: string; value: string; options: CatalogItem[]; onChange: (value: string) => void; onBlur: () => void; disabled: boolean; error: string }) {
  const id = `profile-${label.toLowerCase()}`;
  return <div className="min-w-0"><label htmlFor={id} className="block pl-4 text-xs leading-4 text-[var(--muted)]">{label}</label>
    <select id={id} className={control} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
      <option value="">Select {label.toLowerCase()}</option>{options.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
    </select>{error && <p id={`${id}-error`} className="mt-1 text-sm text-[var(--red)]" role="alert">{error}</p>}</div>;
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image"));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function MyProfilePreview({ userId }: { userId?: string }) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const targetId = userId || currentUser?.id;
  if (!currentUser || !targetId) return <p className="mt-8 text-center" role="status">Loading profile...</p>;
  return <ProfileEditor key={targetId} currentUser={currentUser} targetId={targetId} />;
}

function ProfileEditor({ currentUser, targetId }: { currentUser: AuthUser; targetId: string }) {
  const router = useRouter();
  const client = useApolloClient();
  const { data, loading, error, refetch } = useQuery(PROFILE_USER_QUERY, { variables: { userId: targetId }, fetchPolicy: "network-only" });
  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION);
  const [updateUser] = useMutation(UPDATE_PROFILE_USER_MUTATION);
  const [uploadAvatar] = useMutation(UPLOAD_PROFILE_AVATAR_MUTATION);
  const [deleteAvatar] = useMutation(DELETE_AVATAR);
  const [sendVerification] = useMutation(SEND_PROFILE_VERIFICATION_MUTATION);
  const [draft, setDraft] = useState<Draft>(blank);
  const [touched, setTouched] = useState<Partial<Record<keyof Draft, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [catalogs, setCatalogs] = useState<{ departments: CatalogItem[]; positions: CatalogItem[] } | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const initialized = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const user = data?.user;
  const ownsProfile = currentUser.id === targetId;
  const canEdit = ownsProfile || currentUser.role === "Admin";
  const canVerify = ownsProfile && !user?.is_verified;

  useEffect(() => {
    if (!user || initialized.current) return;
    setDraft(fromUser(user));
    setAvatar(user.profile.avatar);
    initialized.current = true;
  }, [user]);

  useEffect(() => {
    if (!canEdit) return;
    let active = true;
    async function load() {
      setCatalogs(null);
      setCatalogError("");
      try {
        const result = await loadCatalogs(client);
        if (active) setCatalogs(result);
      } catch (cause) { if (active) setCatalogError(getAuthErrorMessage(cause)); }
    }
    void load();
    return () => { active = false; };
  }, [canEdit, catalogAttempt, client]);

  if (loading && !user) return <p className="mt-8 text-center" role="status">Loading profile...</p>;
  if (error && !user) return <div className="mt-8 text-center" role="alert"><p>Could not load the profile. {getAuthErrorMessage(error)}</p><button type="button" className="rounded border px-4 py-2" onClick={() => void refetch()}>Retry</button></div>;
  if (!user) return <p className="mt-8 text-center" role="status">Profile is unavailable.</p>;

  const original = fromUser(user);
  const normalized = { ...draft, first: draft.first.trim(), last: draft.last.trim() };
  const errors = { first: nameError(draft.first, "First name"), last: nameError(draft.last, "Last name"), departmentId: draft.departmentId ? "" : "Department is required", positionId: draft.positionId ? "" : "Position is required" };
  const changed = normalized.first !== original.first || normalized.last !== original.last || draft.departmentId !== original.departmentId || draft.positionId !== original.positionId;
  const valid = Object.values(errors).every((value) => !value);
  const name = [user.profile.first_name, user.profile.last_name].filter(Boolean).join(" ") || user.email;
  const memberDate = /^\d+$/.test(user.created_at) ? new Date(Number(user.created_at)) : new Date(user.created_at);
  const memberSince = Number.isNaN(memberDate.getTime()) ? user.created_at : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(memberDate);
  const departmentOptions = [...(catalogs?.departments ?? [])];
  const positionOptions = [...(catalogs?.positions ?? [])];
  if (user.department && !departmentOptions.some((item) => item.id === user.department?.id)) departmentOptions.push(user.department);
  if (user.position && !positionOptions.some((item) => item.id === user.position?.id)) positionOptions.push(user.position);
  const missingCatalogs = catalogs && (!catalogs.departments.length || !catalogs.positions.length)
    ? !catalogs.departments.length && !catalogs.positions.length ? "departments or positions" : !catalogs.departments.length ? "departments" : "positions"
    : null;

  function change(field: keyof Draft, value: string) { setDraft((current) => ({ ...current, [field]: value })); setTouched((current) => ({ ...current, [field]: true })); setFormError(""); setMessage(""); }
  function touch(field: keyof Draft) { setTouched((current) => ({ ...current, [field]: true })); }
  function visibleError(field: keyof Draft) { return canEdit && (touched[field] || submitted) ? errors[field] : ""; }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitted(true);
    if (!user || !canEdit || !valid || !changed || saving || !catalogs) return;
    setSaving(true); setFormError(""); setMessage("");
    const assignmentChanged = draft.departmentId !== original.departmentId || draft.positionId !== original.positionId;
    const nameChanged = normalized.first !== original.first || normalized.last !== original.last;
    let nameUpdated = false;
    let mutationsCompleted = false;
    try {
      if (nameChanged) {
        await updateProfile({ variables: { profile: { userId: targetId, first_name: normalized.first, last_name: normalized.last } } });
        nameUpdated = true;
      }
      if (assignmentChanged) await updateUser({ variables: { user: { userId: targetId, departmentId: draft.departmentId, positionId: draft.positionId, role: user.role } } });
      mutationsCompleted = true;
      setDraft(normalized);
      await refetch();
      setMessage("Profile updated successfully.");
    } catch (cause) {
      if (mutationsCompleted) {
        setFormError("Profile saved, but its refreshed data could not be loaded. Please retry later.");
      } else {
        let rollbackFailed = false;
        if (nameUpdated) {
          try {
            await updateProfile({ variables: { profile: { userId: targetId, first_name: original.first, last_name: original.last } } });
          } catch { rollbackFailed = true; }
        }
        setFormError(rollbackFailed
          ? "Profile was partially updated. Department or position may have changed. Check the current values before retrying."
          : `Could not update the profile. ${getAuthErrorMessage(cause)}`);
        void refetch().catch(() => {});
      }
    }
    finally { setSaving(false); }
  }

  async function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !canEdit) return;
    setAvatarError(""); setMessage("");
    if (!imageTypes.has(file.type)) { setAvatarError("Choose a PNG, JPG, JPEG or GIF image."); return; }
    if (file.size > avatarLimit) { setAvatarError("Image must be 500 KB or smaller."); return; }
    setUploading(true);
    try {
      const base64 = await readImage(file);
      const result = await uploadAvatar({ variables: { avatar: { userId: targetId, base64, size: file.size, type: file.type } } });
      if (!result.data?.uploadAvatar) throw new Error("Upload failed");
      setAvatar(result.data.uploadAvatar);
      void refetch().catch(() => {});
      setMessage("Avatar updated successfully.");
    } catch (cause) { setAvatarError(`Could not upload the avatar. ${getAuthErrorMessage(cause)}`); }
    finally { setUploading(false); }
  }

  async function removeAvatar() {
    if (!canEdit || !avatar || uploading) return;
    setUploading(true); setAvatarError(""); setMessage("");
    try {
      await deleteAvatar({ variables: { avatar: { userId: targetId } } });
      setAvatar(null);
      void refetch().catch(() => {});
      setMessage("Avatar removed successfully.");
    } catch (cause) { setAvatarError(`Could not remove the avatar. ${getAuthErrorMessage(cause)}`); }
    finally { setUploading(false); }
  }

  async function verifyEmail() {
    if (!user || !canVerify || verifying) return;
    setVerifying(true); setVerifyError("");
    try { await sendVerification({ variables: { email: user.email } }); router.push("/verify-email?sent=1"); }
    catch (cause) { setVerifyError(`Could not send the verification email. ${getAuthErrorMessage(cause)}`); setVerifying(false); }
  }

  return <section className="mx-auto mt-3 w-full max-w-[852px]" aria-label="My profile">
    {message && <div className="fixed top-6 right-6 z-30 flex w-[min(360px,calc(100vw-32px))] justify-between gap-3 rounded-xl border border-[#335d35] bg-[#66bb6a] p-[14px] text-[#335d35] max-[900px]:top-auto max-[900px]:bottom-6" role="status"><p className="m-0">{message}</p><button type="button" className="grid size-6 shrink-0 place-items-center" aria-label="Dismiss notification" onClick={() => setMessage("")}><AppIcon name="cross-green" /></button></div>}
    <div className="flex min-h-[120px] translate-x-5 items-center justify-center gap-[76px] max-[900px]:gap-[38px] max-[600px]:translate-x-0 max-[600px]:gap-5 max-[480px]:flex-col max-[480px]:gap-3">
      <div className="grid size-[120px] shrink-0 place-items-center rounded-full bg-[light-dark(#aeaeae,#626262)] bg-cover bg-center text-[40px] leading-[48px] text-[light-dark(#f5f5f7,#2e2e2e)]" role="img" aria-label={avatar ? `${name}'s avatar` : `${name}'s initials`} style={avatar ? { backgroundImage: `url(${JSON.stringify(avatar)})` } : undefined}>{!avatar && (user.profile.first_name?.[0] || user.email[0] || "?").toUpperCase()}</div>
      {canEdit && <div className="w-[280px] max-[600px]:w-auto max-[480px]:w-full"><input ref={fileInput} className="sr-only" type="file" accept="image/png,image/jpeg,image/gif" aria-label="Choose avatar image" onChange={(event) => void chooseAvatar(event)} /><button type="button" className="flex items-center gap-3 border-0 bg-transparent p-0 text-xl font-medium leading-8 text-[var(--text)] hover:text-[var(--red)] focus-visible:outline-2 focus-visible:outline-[var(--red)] disabled:opacity-50 max-[600px]:gap-1 max-[600px]:text-base max-[480px]:mx-auto" disabled={uploading} onClick={() => fileInput.current?.click()}><AppIcon name="download" className="!size-[35px]" /><span>{uploading ? "Uploading..." : "Upload avatar image"}</span></button><p className="m-0 text-base leading-7 text-[var(--text)] opacity-60 max-[600px]:text-xs max-[480px]:text-center">PNG, JPG, JPEG or GIF, up to 500 KB</p>{avatar && <button type="button" className="mt-1 border-0 bg-transparent p-0 text-sm text-[var(--red)] disabled:opacity-50" disabled={uploading} onClick={() => void removeAvatar()}>Remove avatar</button>}{avatarError && <p className="mt-1 text-sm text-[var(--red)]" role="alert">{avatarError}</p>}</div>}
    </div>
    <div className="mt-8 text-center"><h1 className="mt-0 mb-2 text-2xl leading-8 font-normal">{name}</h1><p className="m-0 text-base leading-6 text-[var(--muted)]">{user.email}</p><p className="m-0 text-base leading-6">A member since {memberSince}</p></div>
    <form className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5 max-[900px]:grid-cols-1" onSubmit={(event) => void submit(event)} noValidate>
      <ProfileInput label="First Name" value={draft.first} onChange={(value) => change("first", value)} onBlur={() => touch("first")} readOnly={!canEdit || saving} error={visibleError("first")} />
      <ProfileInput label="Last Name" value={draft.last} onChange={(value) => change("last", value)} onBlur={() => touch("last")} readOnly={!canEdit || saving} error={visibleError("last")} />
      <ProfileSelect label="Department" value={draft.departmentId} options={departmentOptions} onChange={(value) => change("departmentId", value)} onBlur={() => touch("departmentId")} disabled={!canEdit || !catalogs || saving} error={visibleError("departmentId")} />
      <ProfileSelect label="Position" value={draft.positionId} options={positionOptions} onChange={(value) => change("positionId", value)} onBlur={() => touch("positionId")} disabled={!canEdit || !catalogs || saving} error={visibleError("positionId")} />
      {canEdit && !catalogs && !catalogError && <p className="col-span-full text-sm text-[var(--muted)]" role="status">Loading departments and positions...</p>}
      {canEdit && missingCatalogs && <p className="col-span-full text-sm text-[var(--muted)]" role="status">{`No ${missingCatalogs} are available yet. This profile cannot be completed until they are added.`}</p>}
      {catalogError && <div className="col-span-full text-sm text-[var(--red)]" role="alert">Could not load departments and positions. {catalogError} <button type="button" className="underline" onClick={() => setCatalogAttempt((value) => value + 1)}>Retry</button></div>}
      {formError && <p className="col-span-full text-sm text-[var(--red)]" role="alert">{formError}</p>}{verifyError && <p className="col-span-full text-sm text-[var(--red)]" role="alert">{verifyError}</p>}
      {(canEdit || canVerify) && <div className="col-span-full mt-4 flex justify-end gap-6 max-[600px]:gap-3">{canVerify && <button type="button" className={`${action} border border-[light-dark(#626262,#e2e2e4)] bg-transparent text-[light-dark(#626262,#e2e2e4)]`} onClick={() => void verifyEmail()} disabled={verifying}>{verifying ? "Sending..." : "Verify email"}</button>}{canEdit && <button type="submit" className={`${action} border-0 bg-[var(--red)] text-[#f5f5f7]`} disabled={!changed || !valid || !catalogs || saving}>{saving ? "Updating..." : "Update"}</button>}</div>}
    </form>
  </section>;
}
