"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { AppIcon } from "@/components/app-icon";

type ProfileSection = "Profile" | "Skills" | "Languages" | "CVs";
type ProfileRole = "user" | "admin";

export function ProfileBreadcrumbs({ role, section, displayName }: { role: ProfileRole; section: ProfileSection; displayName: string }) {
  return (
    <nav className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap max-[600px]:gap-1 max-[600px]:text-[13px]" aria-label="Breadcrumb">
      <Link className="shrink-0 text-[var(--muted)] no-underline hover:underline" href={role === "admin" ? "/admin/employees" : "/employees"}>Employees</Link>
      <AppIcon name="arrow-nav" className="!size-5" />
      <span className="inline-flex min-w-0 items-center gap-1 text-[var(--red)]">
        <span className="max-[600px]:hidden"><AppIcon name="person-red" /></span>
        <span className="truncate">{displayName}</span>
      </span>
      <AppIcon name="arrow-nav" className="!size-5" />
      <span className="shrink-0" aria-current="page">{section}</span>
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
    <nav className="flex h-[52px] max-w-full overflow-x-auto" aria-label="User details sections">
      {tabs.map((tab) => {
        const active = segment === tab.segment;
        return <Link key={tab.href} href={tab.href} className={`grid w-[150px] shrink-0 place-items-center text-sm font-medium leading-[17.5px] tracking-[.4px] uppercase no-underline hover:text-[var(--red)] max-[600px]:w-auto max-[600px]:flex-1 ${active ? "border-b-2 border-[var(--red)] font-semibold text-[var(--red)]" : "text-[var(--text)]"}`} aria-current={active ? "page" : undefined}>{tab.label}</Link>;
      })}
    </nav>
  );
}
