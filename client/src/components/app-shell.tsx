"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppIcon, type IconName } from "@/components/app-icon";

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

export function AppShell({ title, role = "user", initiallyCollapsed = false, activeSection, headerClassName = "", showSettingsLink = false, children }: { title: ReactNode; role?: "user" | "admin"; initiallyCollapsed?: boolean; activeSection?: string; headerClassName?: string; showSettingsLink?: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [desktopExpanded, setDesktopExpanded] = useState(!initiallyCollapsed);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(pathname === "/settings");

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
          aria-expanded={tabletExpanded}
          onClick={() => {
            if (window.matchMedia("(max-width: 900px)").matches) setTabletExpanded((open) => !open);
            else setDesktopExpanded((open) => !open);
          }}
        >
          <AppIcon name="chevron" className="sidebar-collapse-icon" />
        </button>

        <nav className="sidebar-main" aria-label="Sections">
          {visibleMainItems.map((item) => (
            <SidebarLink key={item.href} item={item} active={(activeSection ?? pathname) === item.href} onNavigate={closeTablet} />
          ))}
          {showSettingsLink && role === "user" && (
            <div className="sidebar-profile-settings">
              <SidebarLink item={{ label: "Settings", href: "/settings", icon: "settings" }} active={pathname === "/settings"} onNavigate={closeTablet} />
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
              <SidebarLink item={{ label: "Profile", href: role === "admin" ? "/admin/profile" : "/profile", icon: "profile" }} active={pathname === "/profile" || pathname === "/admin/profile"} onNavigate={closeTablet} />
              <SidebarLink item={{ label: "Settings", href: "/settings", icon: "settings" }} active={pathname === "/settings"} onNavigate={closeTablet} />
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
        <header className={`app-header ${headerClassName}`.trim()}>{title}</header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
