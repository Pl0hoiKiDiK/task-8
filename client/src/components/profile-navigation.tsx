"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { AppIcon } from "@/components/app-icon";

type ProfileSection = "Profile" | "Skills" | "Languages" | "CVs";
type ProfileRole = "user" | "admin";

export function ProfileBreadcrumbs({ role, section }: { role: ProfileRole; section: ProfileSection }) {
  return (
    <nav className="profile-breadcrumbs" aria-label="Breadcrumb">
      <Link href={role === "admin" ? "/admin/employees" : "/employees"}>Employees</Link>
      <AppIcon name="arrow-nav" />
      <span className="profile-breadcrumb-person"><AppIcon name="person-red" /> Rostislav Harlanov</span>
      <AppIcon name="arrow-nav" />
      <span aria-current="page">{section}</span>
    </nav>
  );
}

export function ProfileTabs({ basePath, showCvs = false }: { basePath: "/profile" | "/admin/profile"; showCvs?: boolean }) {
  const segment = useSelectedLayoutSegment();
  const tabs = [
    { label: "Profile", href: basePath, segment: null },
    { label: "Skills", href: `${basePath}/skills`, segment: "skills" },
    { label: "Languages", href: `${basePath}/languages`, segment: "languages" },
    ...(showCvs ? [{ label: "CVs", href: `${basePath}/cvs`, segment: "cvs" }] : []),
  ];

  return (
    <nav className={`my-profile-tabs${showCvs ? " my-profile-tabs--four" : ""}`} aria-label="User details sections">
      {tabs.map((tab) => {
        const active = segment === tab.segment;
        return <Link key={tab.href} href={tab.href} className={`my-profile-tab${active ? " my-profile-tab--active" : ""}`} aria-current={active ? "page" : undefined}>{tab.label}</Link>;
      })}
    </nav>
  );
}
