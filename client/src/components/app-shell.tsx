"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppIcon, type IconName } from "@/components/app-icon";
import { ProfileBreadcrumbs } from "@/components/profile-navigation";
import { CvDetailsBreadcrumbs, type CvSection } from "@/components/cv-details-page";

type NavItem = { label: string; href: string; icon: IconName };

const mainItems: NavItem[] = [
  { label: "Employees", href: "/employees", icon: "employees" },
  { label: "Skills", href: "/skills", icon: "skills" },
  { label: "Languages", href: "/languages", icon: "languages" },
  { label: "CVs", href: "/cvs", icon: "cvs" },
];

const adminItems: NavItem[] = [
  { label: "Departments", href: "/admin/departments", icon: "departments" },
  { label: "Positions", href: "/admin/positions", icon: "positions" },
  { label: "Projects", href: "/admin/projects", icon: "projects" },
];

function SidebarLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      className={`sidebar-link${active ? " sidebar-link--active" : ""}${item.icon === "employees" && !active ? " sidebar-link--employees-inactive" : ""}`}
      aria-current={active ? "page" : undefined}
      title={item.label}
      onClick={onNavigate}
    >
      <AppIcon name={item.icon} />
      <span className="sidebar-label">{item.label}</span>
    </Link>
  );
}

const pageTitles: Record<string, string> = {
  employees: "Employees",
  skills: "Skills",
  languages: "Languages",
  cvs: "CVs",
  departments: "Departments",
  positions: "Positions",
  projects: "Projects",
  settings: "Settings",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const role = pathname.startsWith("/admin/") ? "admin" : "user";
  const prefix = role === "admin" ? "/admin" : "";
  const isProfile = pathname === `${prefix}/profile` || pathname.startsWith(`${prefix}/profile/`);
  const cvPath = !isProfile ? pathname.match(/^\/(?:admin\/)?cvs\/([^/]+)(?:\/(skills|projects|preview))?\/?$/) : null;
  const cvId = cvPath?.[1];
  const cvSection = (cvPath?.[2] ?? "details") as CvSection;
  const profileSection = pathname.endsWith("/skills") ? "Skills" : pathname.endsWith("/languages") ? "Languages" : pathname.endsWith("/cvs") || pathname.includes("/cvs/") ? "CVs" : "Profile";
  const title = isProfile
    ? <ProfileBreadcrumbs role={role} section={profileSection} />
    : cvId ? <CvDetailsBreadcrumbs cvId={cvId} role={role === "admin" ? "admin" : "employee"} section={cvSection} />
    : pageTitles[pathname.split("/").filter(Boolean).at(-1) ?? ""] ?? "";
  const activeSection = isProfile ? `${prefix}/employees` : cvId ? `${prefix}/cvs` : pathname;
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(pathname.endsWith("/settings"));

  const closeTablet = () => setTabletExpanded(false);
  const visibleMainItems = role === "admin"
    ? mainItems.map((item) => ({ ...item, href: `/admin${item.href}` }))
    : mainItems;

  return (
    <div className={`app-shell${desktopExpanded ? "" : " app-shell--collapsed"}${tabletExpanded ? " app-shell--tablet-open" : ""}`}>
      {tabletExpanded && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={closeTablet} />}

      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <AppIcon name="logo" className="sidebar-logo" />
          <span className="sidebar-label">CV Builder</span>
        </div>

        <button
          className="sidebar-collapse"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={tabletExpanded || desktopExpanded}
          onClick={() => {
            if (window.matchMedia("(max-width: 900px)").matches) setTabletExpanded((open) => !open);
            else setDesktopExpanded((open) => !open);
          }}
        >
          <AppIcon name="chevron" className="sidebar-collapse-icon" />
        </button>

        <nav className="sidebar-main" aria-label="Sections">
          {visibleMainItems.map((item) => (
            <SidebarLink key={item.href} item={item} active={activeSection === item.href} onNavigate={closeTablet} />
          ))}
          {isProfile && role === "user" && (
            <div className="sidebar-profile-settings">
              <SidebarLink item={{ label: "Settings", href: `${prefix}/settings`, icon: "settings" }} active={pathname === `${prefix}/settings`} onNavigate={closeTablet} />
            </div>
          )}
          {role === "admin" && (
            <div className="sidebar-admin">
              {adminItems.map((item) => <SidebarLink key={item.href} item={item} active={pathname === item.href} onNavigate={closeTablet} />)}
            </div>
          )}
        </nav>

        <div className="sidebar-bottom">
          {profileOpen && (
            <nav className="profile-menu" aria-label="Account">
              <SidebarLink item={{ label: "Profile", href: `${prefix}/profile`, icon: "profile" }} active={pathname === `${prefix}/profile`} onNavigate={closeTablet} />
              <SidebarLink item={{ label: "Settings", href: `${prefix}/settings`, icon: "settings" }} active={pathname === `${prefix}/settings`} onNavigate={closeTablet} />
              <button className="sidebar-link" type="button" disabled title="Sign out is not connected yet">
                <AppIcon name="logout" /><span className="sidebar-label">Log out</span>
              </button>
            </nav>
          )}
          <button className="sidebar-account" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
            <span className="account-avatar">R</span>
            <span className="sidebar-label">Rostislav Harlanov</span>
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className={`app-header${isProfile ? " profile-header" : ""}${cvId ? " cv-details-header" : ""}`}>{title}</header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
