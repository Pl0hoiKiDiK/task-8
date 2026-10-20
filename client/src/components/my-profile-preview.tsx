"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { AppIcon } from "@/components/app-icon";
import { useCvPreviewData } from "@/components/profile-cvs-data";
import { SEND_VERIFICATION_MUTATION } from "@/lib/auth/api/graphql";
import { DEPARTMENTS_QUERY, loadAllCatalogItems, POSITIONS_QUERY } from "@/lib/catalog-api";
import { DELETE_AVATAR, PROFILE_USER_QUERY, UPDATE_PROFILE, UPDATE_USER_ASSIGNMENT, UPLOAD_AVATAR } from "@/lib/cv-api";

export function MyProfilePreview({ canEdit = true, isOwner = true }: { canEdit?: boolean; isOwner?: boolean }) {
  const router = useRouter();
  const client = useApolloClient();
  const { currentUserId, currentUserEmail, profile, loadState, reload } = useCvPreviewData();
  const userResult = useQuery(PROFILE_USER_QUERY, { variables: { userId: currentUserId }, skip: !currentUserId });
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({ version: "", firstName: "", lastName: "", departmentId: "", positionId: "" });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "error">("loading");
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sourceVersion = profile && userResult.data?.user ? JSON.stringify([
    currentUserId, profile.first_name, profile.last_name,
    userResult.data.user.department?.id, userResult.data.user.position?.id,
  ]) : "";
  if (sourceVersion && draft.version !== sourceVersion) {
    setDraft({
      version: sourceVersion,
      firstName: profile?.first_name ?? "", lastName: profile?.last_name ?? "",
      departmentId: userResult.data?.user.department?.id ?? "",
      positionId: userResult.data?.user.position?.id ?? "",
    });
  }
  const { firstName, lastName, departmentId, positionId } = draft;
  useEffect(() => {
    if (!currentUserId) return;
    let active = true;
    void Promise.all([
      loadAllCatalogItems(client, DEPARTMENTS_QUERY, "departments"),
      loadAllCatalogItems(client, POSITIONS_QUERY, "positions"),
    ]).then(([loadedDepartments, loadedPositions]) => {
      if (!active) return;
      setDepartments(loadedDepartments);
      setPositions(loadedPositions);
      setCatalogState("ready");
    }).catch(() => { if (active) setCatalogState("error"); });
    return () => { active = false; };
  }, [client, currentUserId, catalogAttempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || saving || !firstName.trim() || !lastName.trim() || !departmentId || !positionId) return;
    setSaving(true);
    setMessage(""); setError("");
    try {
      if (firstName.trim() !== (profile?.first_name ?? "") || lastName.trim() !== (profile?.last_name ?? "")) {
        await client.mutate({ mutation: UPDATE_PROFILE, variables: { profile: { userId: currentUserId, first_name: firstName.trim(), last_name: lastName.trim() } } });
      }
      if (departmentId !== userResult.data?.user.department?.id || positionId !== userResult.data?.user.position?.id) {
        await client.mutate({ mutation: UPDATE_USER_ASSIGNMENT, variables: { user: { userId: currentUserId, departmentId, positionId, role: userResult.data?.user.role } } });
        await userResult.refetch();
      }
      await reload();
      setMessage("Profile updated");
    } catch { setError("Failed to update profile. Please try again."); }
    finally { setSaving(false); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    if (!canEdit) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!(["image/png", "image/jpeg", "image/gif"].includes(file.type)) || file.size > 500_000) {
      setError("Choose a PNG, JPG or GIF image under 0.5 MB.");
      return;
    }
    setUploading(true); setError(""); setMessage("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
      });
      await client.mutate({ mutation: UPLOAD_AVATAR, variables: { avatar: { userId: currentUserId, base64, size: file.size, type: file.type } } });
      await reload();
      setMessage("Avatar updated");
    } catch { setError("Failed to upload avatar. Please try again."); }
    finally { setUploading(false); }
  }

  async function removeAvatar() {
    if (!canEdit) return;
    setUploading(true); setError(""); setMessage("");
    try {
      await client.mutate({ mutation: DELETE_AVATAR, variables: { avatar: { userId: currentUserId } } });
      await reload();
      setMessage("Avatar removed");
    } catch { setError("Failed to remove avatar. Please try again."); }
    finally { setUploading(false); }
  }

  async function sendVerification() {
    if (!isOwner || profile?.is_verified || sendingVerification || !currentUserEmail) return;
    setSendingVerification(true); setError("");
    try {
      await client.mutate({ mutation: SEND_VERIFICATION_MUTATION, variables: { email: currentUserEmail } });
      router.push("/verify-email?sent=1");
    } catch {
      setError("Failed to send verification email. Please try again.");
    } finally { setSendingVerification(false); }
  }

  if (loadState === "loading" || userResult.loading || catalogState === "loading") return <p role="status">Loading profile…</p>;
  if (loadState === "error" || !profile || userResult.error || catalogState === "error") return <div role="alert">Could not load profile. <button type="button" onClick={() => { void reload().catch(() => undefined); if (currentUserId) void userResult.refetch().catch(() => undefined); setCatalogState("loading"); setCatalogAttempt((attempt) => attempt + 1); }}>Retry</button></div>;

  const fullName = profile.full_name || [firstName, lastName].filter(Boolean).join(" ") || currentUserEmail;
  const joined = new Date(profile.created_at);
  const joinedLabel = Number.isNaN(joined.valueOf()) ? "" : joined.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const dirty = firstName.trim() !== (profile.first_name ?? "") || lastName.trim() !== (profile.last_name ?? "") || departmentId !== (userResult.data?.user.department?.id ?? "") || positionId !== (userResult.data?.user.position?.id ?? "");
  const valid = Boolean(firstName.trim() && lastName.trim() && departmentId && positionId);

  return <div className="my-profile-page">
    {message && <div className="my-profile-toast" role="status"><strong>{message}</strong><button type="button" aria-label="Dismiss notification" onClick={() => setMessage("")}><AppIcon name="cross-green" /></button></div>}
    {error && <p className="cv-skill-system-error" role="alert">{error}</p>}
    <section className="my-profile-content" aria-label={isOwner ? "My profile" : "User profile"}>
      <div className="my-profile-avatar-row">
        <div className="my-profile-avatar" aria-label="Profile avatar">{profile.avatar ? <img src={profile.avatar} alt={fullName} className="h-full w-full rounded-full object-cover" /> : (fullName.charAt(0).toUpperCase() || "?")}</div>
        {canEdit && <div className="my-profile-upload">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif" className="sr-only" aria-label="Choose avatar image" onChange={(event) => { void upload(event); }} />
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}><AppIcon name="download" className="my-profile-upload-icon" /><span>{uploading ? "Uploading..." : "Upload avatar image"}</span></button>
          {profile.avatar && <button type="button" disabled={uploading} onClick={() => { void removeAvatar(); }}>Remove avatar</button>}
          <p>png, jpg or gif no more than 0.5MB</p>
        </div>}
      </div>
      <div className="my-profile-identity">
        <h1>{fullName}</h1>
        <p className="my-profile-email">{profile.email || currentUserEmail}</p>
        {joinedLabel && <p>A member since {joinedLabel}</p>}
      </div>
      <form className="my-profile-form" onSubmit={(event) => { void save(event); }}>
        <label className="my-profile-field"><span>First Name</span><input value={firstName} maxLength={100} required disabled={!canEdit} aria-invalid={canEdit && !firstName.trim()} onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))} />{canEdit && !firstName.trim() && <span className="cv-skill-field-error">First name is required</span>}</label>
        <label className="my-profile-field"><span>Last Name</span><input value={lastName} maxLength={100} required disabled={!canEdit} aria-invalid={canEdit && !lastName.trim()} onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))} />{canEdit && !lastName.trim() && <span className="cv-skill-field-error">Last name is required</span>}</label>
        <label className="my-profile-field my-profile-field--select"><span>Department</span><select value={departmentId} required disabled={!canEdit} aria-invalid={canEdit && !departmentId} onChange={(event) => setDraft((current) => ({ ...current, departmentId: event.target.value }))}><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{canEdit && !departmentId && <span className="cv-skill-field-error">Department is required</span>}</label>
        <label className="my-profile-field my-profile-field--select"><span>Position</span><select value={positionId} required disabled={!canEdit} aria-invalid={canEdit && !positionId} onChange={(event) => setDraft((current) => ({ ...current, positionId: event.target.value }))}><option value="">Select position</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{canEdit && !positionId && <span className="cv-skill-field-error">Position is required</span>}</label>
        {(canEdit || isOwner) && <div className="my-profile-actions">
          {isOwner && !profile.is_verified && <button type="button" className="my-profile-verify" disabled={sendingVerification} onClick={() => { void sendVerification(); }}>{sendingVerification ? "Sending..." : "Verify email"}</button>}
          {canEdit && <button type="submit" className="my-profile-update" disabled={!dirty || !valid || saving}>{saving ? "Updating..." : "Update"}</button>}
        </div>}
      </form>
    </section>
  </div>;
}
