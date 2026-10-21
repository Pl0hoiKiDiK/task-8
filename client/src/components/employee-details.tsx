"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { AppIcon } from "@/components/app-icon";
import { MyProfilePreview } from "@/components/my-profile-preview";
import { UserSkillsPreview } from "@/components/user-skills-preview";
import { UserLanguagesPreview } from "@/components/user-languages-preview";
import { ProfileCvsPreview } from "@/components/profile-cvs-preview";
import { CvPreviewProvider } from "@/components/profile-cvs-data";
import { LanguagePreviewProvider } from "@/components/profile-languages-data";
import { EMPLOYEE_QUERY } from "@/lib/employees/api";
import { useAppSelector } from "@/lib/hooks";

export type EmployeeSection = "profile" | "skills" | "languages" | "cvs";

const sections: { id: EmployeeSection; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "skills", label: "Skills" },
  { id: "languages", label: "Languages" },
  { id: "cvs", label: "CVs" },
];

export function EmployeeDetails({ userId, admin = false, section = "profile" }: {
  userId: string;
  admin?: boolean;
  section?: EmployeeSection;
}) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAdmin = admin && currentUser?.role === "Admin";
  const canEdit = isAdmin || currentUser?.id === userId;
  const activeSection = section === "cvs" && !isAdmin ? "profile" : section;
  const prefix = admin ? "/admin" : "";
  const basePath = `${prefix}/employees/${encodeURIComponent(userId)}`;
  const { data, loading, error, refetch } = useQuery(EMPLOYEE_QUERY, {
    variables: { userId }, fetchPolicy: "network-only",
  });
  const employee = data?.user;
  const name = employee
    ? [employee.profile.first_name, employee.profile.last_name].filter(Boolean).join(" ") || employee.email
    : "";

  return <section className="mx-auto w-full max-w-[1200px] px-2 pb-10 sm:px-5" aria-label="User details">
    {loading && !employee ? <p role="status">Loading user details…</p>
      : error || !employee ? <div><p role="alert">Could not load user details.</p><button type="button" className="mt-3 text-[var(--red)] underline" onClick={() => void refetch()}>Retry</button></div>
        : <>
          <nav className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-sm sm:text-base" aria-label="Breadcrumb">
            <Link href={`${prefix}/employees`} className="shrink-0 text-[var(--muted)] no-underline hover:underline">Employees</Link>
            <AppIcon name="arrow-nav" className="!size-5 shrink-0" />
            <span className="min-w-0 truncate text-[var(--red)]">{name}</span>
            <AppIcon name="arrow-nav" className="!size-5 shrink-0" />
            <span className="shrink-0" aria-current="page">{sections.find((item) => item.id === activeSection)?.label}</span>
          </nav>
          <nav className="mt-4 flex h-[52px] max-w-full overflow-x-auto" aria-label="User details sections">
            {sections.filter((item) => item.id !== "cvs" || isAdmin).map((item) => {
              const href = item.id === "profile" ? basePath : `${basePath}?section=${item.id}`;
              const active = item.id === activeSection;
              return <Link key={item.id} href={href}
                className={`grid w-[150px] shrink-0 place-items-center text-sm font-medium uppercase no-underline hover:text-[var(--red)] max-[700px]:min-w-[90px] max-[700px]:flex-1 ${active ? "border-b-2 border-[var(--red)] font-semibold text-[var(--red)]" : "text-[var(--text)]"}`}
                aria-current={active ? "page" : undefined}>{item.label}</Link>;
            })}
          </nav>
          {activeSection === "profile" ? <MyProfilePreview userId={userId} />
            : activeSection === "skills" ? <CvPreviewProvider key={`${userId}:skills`} scope="profile-skills" targetUserId={userId}>
              <UserSkillsPreview canEdit={canEdit} />
            </CvPreviewProvider>
              : activeSection === "languages" ? <CvPreviewProvider key={`${userId}:languages`} scope="profile-languages" targetUserId={userId}>
                <LanguagePreviewProvider><UserLanguagesPreview canEdit={canEdit} /></LanguagePreviewProvider>
              </CvPreviewProvider>
                : <CvPreviewProvider key={`${userId}:cvs`} scope="cvs" targetUserId={userId}>
                  <ProfileCvsPreview ownerId={userId} />
                </CvPreviewProvider>}
        </>}
  </section>;
}
