"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { EmployeeAvatar } from "@/components/employees-preview";
import { MyProfilePreview } from "@/components/my-profile-preview";
import { CvPreviewProvider, useCvPreviewData } from "@/components/profile-cvs-data";
import { LanguagePreviewProvider } from "@/components/profile-languages-data";
import { ProfileCvsPreview } from "@/components/profile-cvs-preview";
import { UserLanguagesPreview } from "@/components/user-languages-preview";
import { UserSkillsPreview } from "@/components/user-skills-preview";
import { EMPLOYEE_QUERY, type Employee } from "@/lib/employees/api";
import { useAppSelector } from "@/lib/hooks";

type UserTab = "profile" | "skills" | "languages" | "cvs";

export function EmployeeDetails({ userId, admin = false }: { userId: string; admin?: boolean }) {
  const prefix = admin ? "/admin" : "";
  const auth = useAppSelector((state) => state.auth);
  const { data, loading, error, refetch } = useQuery(EMPLOYEE_QUERY, { variables: { userId }, fetchPolicy: "network-only" });
  const employee = data?.user;
  const isAdmin = auth.user?.role === "Admin";
  const isOwner = auth.user?.id === userId;
  const canEdit = isAdmin || isOwner;

  return <section className="mx-auto w-full max-w-5xl px-2 pb-10 sm:px-5" aria-label="User details">
    <Link href={`${prefix}/employees`} className="mb-8 inline-flex items-center gap-2 text-[var(--red)] hover:underline">← Employees</Link>
    {loading ? <p role="status">Loading user details…</p>
      : error || !employee ? <div><p role="alert">Could not load user details.</p><button type="button" className="mt-3 text-[var(--red)] underline" onClick={() => void refetch()}>Retry</button></div>
        : <CvPreviewProvider targetUserId={userId} targetUserEmail={employee.email} targetIsVerified={employee.is_verified}>
            <LanguagePreviewProvider>
              <UserDetailsContent employee={employee} isAdmin={isAdmin} isOwner={isOwner} canEdit={canEdit} />
            </LanguagePreviewProvider>
          </CvPreviewProvider>}
  </section>;
}

function UserDetailsContent({ employee, isAdmin, isOwner, canEdit }: {
  employee: Employee;
  isAdmin: boolean;
  isOwner: boolean;
  canEdit: boolean;
}) {
  const [tab, setTab] = useState<UserTab>("profile");
  const { profile } = useCvPreviewData();
  const name = [profile?.first_name ?? employee.profile.first_name, profile?.last_name ?? employee.profile.last_name]
    .filter(Boolean).join(" ") || employee.email;
  const avatarEmployee: Employee = { ...employee, profile: { ...employee.profile,
    first_name: profile?.first_name ?? employee.profile.first_name,
    last_name: profile?.last_name ?? employee.profile.last_name,
    avatar: profile?.avatar ?? employee.profile.avatar,
  } };
  const tabs: { id: UserTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "skills", label: "Skills" },
    { id: "languages", label: "Languages" },
    ...(isAdmin ? [{ id: "cvs" as const, label: "CVs" }] : []),
  ];

  return <>
    <div className="flex flex-wrap items-center gap-5 border-b border-[var(--border)] pb-5">
      <EmployeeAvatar employee={avatarEmployee} size={72} />
      <div className="min-w-0"><h1 className="text-2xl font-medium break-words">{name}</h1><p className="mt-1 break-all text-[var(--muted)]">{employee.email}</p></div>
    </div>
    <nav className="mt-4 flex flex-wrap gap-1 border-b border-[var(--border)]" aria-label="User details tabs">
      {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id}
        className={`border-b-2 px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[var(--red)] ${tab === item.id ? "border-[var(--red)] text-[var(--red)]" : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}
        onClick={() => setTab(item.id)}>{item.label}</button>)}
    </nav>
    <div className="pt-6" role="tabpanel" aria-label={`${tab} details`}>
      {tab === "profile" ? <MyProfilePreview canEdit={canEdit} isOwner={isOwner} />
        : tab === "skills" ? <UserSkillsPreview canEdit={canEdit} />
          : tab === "languages" ? <UserLanguagesPreview canEdit={canEdit} />
            : isAdmin ? <ProfileCvsPreview view="user" ownerId={employee.id} /> : null}
    </div>
  </>;
}
