"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApolloClient } from "@apollo/client/react";
import { AppIcon, type IconName } from "@/components/app-icon";
import { ProfileBreadcrumbs } from "@/components/profile-navigation";
import { CvDetailsBreadcrumbs, type CvSection } from "@/components/cv-details-page";
import { useCvPreviewData } from "@/components/profile-cvs-data";
import { refreshTokenStorage, sessionCleared } from "@/lib/auth/model/auth-slice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

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

function SidebarLink({ item, active, onNavigate, labelClass, menu = false }: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
  labelClass: string;
  menu?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`flex w-full items-center gap-4 border-0 px-4 text-base leading-6 tracking-[.15px] whitespace-nowrap no-underline hover:bg-[var(--sidebar-active)] hover:text-[var(--text)] ${menu ? "h-10 rounded-none" : "h-14 rounded-r-[28px]"} ${active ? "bg-[var(--sidebar-active)] text-[var(--text)]" : menu ? "text-[var(--text)]" : "text-[var(--muted)]"}`}
      aria-current={active ? "page" : undefined}
      title={item.label}
      onClick={onNavigate}
    >
      <AppIcon name={item.icon} />
      <span className={menu ? "" : labelClass}>{item.label}</span>
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
  const router = useRouter();
  const client = useApolloClient();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const { profile } = useCvPreviewData();
  const profileName = profile?.full_name?.trim() || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  const accountName = profileName || authUser?.email || "Account";
  const accountInitial = accountName.charAt(0).toLocaleUpperCase();
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const role = pathname.startsWith("/admin/") ? "admin" : "user";
  const prefix = role === "admin" ? "/admin" : "";
  const isProfile = pathname === `${prefix}/profile` || pathname.startsWith(`${prefix}/profile/`);
  const cvPath = !isProfile ? pathname.match(/^\/(?:admin\/)?cvs\/([^/]+)(?:\/(skills|projects|preview))?\/?$/) : null;
  const cvId = cvPath?.[1];
  const cvSection = (cvPath?.[2] ?? "details") as CvSection;
  const profileSection = pathname.endsWith("/skills") ? "Skills" : pathname.endsWith("/languages") ? "Languages" : pathname.endsWith("/cvs") || pathname.includes("/cvs/") ? "CVs" : "Profile";
  const title = isProfile
    ? <ProfileBreadcrumbs role={role} section={profileSection} displayName={accountName} />
    : cvId ? <CvDetailsBreadcrumbs cvId={cvId} role={role === "admin" ? "admin" : "employee"} section={cvSection} />
    : pageTitles[pathname.split("/").filter(Boolean).at(-1) ?? ""] ?? "";
  const activeSection = isProfile ? `${prefix}/employees` : cvId ? `${prefix}/cvs` : pathname;
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const labelClass = `${desktopExpanded ? "" : "min-[901px]:hidden"} ${tabletExpanded ? "max-[900px]:inline" : "max-[900px]:hidden"}`;

  useEffect(() => {
    if (!profileOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        accountButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  function closeNavigation() {
    setTabletExpanded(false);
    setProfileOpen(false);
  }

  async function signOut() {
    refreshTokenStorage.clear();
    dispatch(sessionCleared());
    closeNavigation();
    await client.clearStore().catch(() => undefined);
    try {
      sessionStorage.setItem("cv-builder-logout-notice", "1");
    } catch {
      // Signing out must still work when browser storage is unavailable.
    }
    router.replace("/signin");
  }

  const visibleMainItems = role === "admin"
    ? mainItems.map((item) => ({ ...item, href: `/admin${item.href}` }))
    : mainItems;

  return (
    <div className="app-shell min-h-dvh">
      {tabletExpanded && <button className="fixed inset-0 z-[19] border-0 bg-black/60 min-[901px]:hidden" type="button" aria-label="Close navigation" onClick={() => setTabletExpanded(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-14 flex-col bg-[var(--surface)] transition-[width] duration-[180ms] print:hidden ${desktopExpanded ? "min-[901px]:w-[200px]" : "min-[901px]:w-14"} ${tabletExpanded ? "max-[900px]:w-[200px]" : "max-[900px]:w-14"}`}
        aria-label="Main navigation"
      >
        <div className="flex h-14 shrink-0 items-center gap-4 px-4 text-base font-medium leading-6 tracking-[.15px] whitespace-nowrap">
          <AppIcon name="logo" />
          <span className={labelClass}>CV Builder</span>
        </div>

        <button
          className="absolute top-[52px] -right-3 z-[25] hidden size-6 place-items-center rounded-full border-0 bg-[var(--surface)] text-[var(--muted)] min-[901px]:grid"
          type="button"
          aria-label={desktopExpanded ? "Collapse navigation" : "Expand navigation"}
          aria-expanded={desktopExpanded}
          onClick={() => { setDesktopExpanded((open) => !open); setProfileOpen(false); }}
        >
          <AppIcon name="chevron" className={desktopExpanded ? "" : "rotate-180"} />
        </button>
        <button
          className="absolute top-[52px] -right-3 z-[25] grid size-6 place-items-center rounded-full border-0 bg-[var(--surface)] text-[var(--muted)] min-[901px]:hidden"
          type="button"
          aria-label={tabletExpanded ? "Close navigation" : "Open navigation"}
          aria-expanded={tabletExpanded}
          onClick={() => { setTabletExpanded((open) => !open); setProfileOpen(false); }}
        >
          <AppIcon name="chevron" />
        </button>

        <nav className="min-h-0 flex-1 overflow-y-auto pt-3.5" aria-label="Sections">
          <div className="flex flex-col gap-3.5">
            {visibleMainItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={activeSection === item.href} onNavigate={closeNavigation} labelClass={labelClass} />
            ))}
          </div>
          {isProfile && role === "user" && (
            <div className="mt-3.5 max-[900px]:hidden">
              <SidebarLink item={{ label: "Settings", href: `${prefix}/settings`, icon: "settings" }} active={pathname === `${prefix}/settings`} onNavigate={closeNavigation} labelClass={labelClass} />
            </div>
          )}
          {role === "admin" && (
            <div className="mt-7 flex flex-col gap-3.5 border-t border-[var(--border)] pt-3.5">
              {adminItems.map((item) => <SidebarLink key={item.href} item={item} active={pathname === item.href} onNavigate={closeNavigation} labelClass={labelClass} />)}
            </div>
          )}
        </nav>

        <div className="relative shrink-0 pb-12 max-[900px]:pb-14" ref={accountRef}>
          {profileOpen && (
            <nav id="account-menu" className="absolute bottom-full left-0 z-30 mb-2 w-[200px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--menu-surface)]" aria-label="Account">
              <SidebarLink item={{ label: "Profile", href: `${prefix}/profile`, icon: "profile" }} active={pathname === `${prefix}/profile`} onNavigate={closeNavigation} labelClass={labelClass} menu />
              <SidebarLink item={{ label: "Settings", href: `${prefix}/settings`, icon: "settings" }} active={pathname === `${prefix}/settings`} onNavigate={closeNavigation} labelClass={labelClass} menu />
              <button className="flex h-10 w-full items-center gap-4 border-0 border-t border-[var(--border)] bg-transparent px-4 text-left text-base leading-6 tracking-[.15px] text-[var(--text)] hover:bg-[var(--sidebar-active)]" type="button" onClick={signOut}>
                <AppIcon name="logout" /><span>Log out</span>
              </button>
            </nav>
          )}
          <button className="flex w-full items-center gap-2 border-0 bg-transparent p-2 text-left text-base leading-6 tracking-[.15px] whitespace-nowrap text-[var(--text)]" ref={accountButtonRef} type="button" aria-expanded={profileOpen} aria-controls={profileOpen ? "account-menu" : undefined} onClick={() => setProfileOpen((open) => !open)}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--red)] text-xl text-[#f5f5f7]">{accountInitial}</span>
            <span className={labelClass}>{accountName}</span>
          </button>
        </div>
      </aside>

      <div className={`min-w-0 transition-[margin-left] duration-[180ms] print:ml-0 ${desktopExpanded ? "min-[901px]:ml-[200px]" : "min-[901px]:ml-14"} max-[900px]:ml-14`}>
        <header className={`flex h-14 min-w-0 items-center pr-11 pl-11 text-base leading-6 tracking-[.15px] text-[var(--muted)] print:hidden max-[600px]:pl-6 ${isProfile || cvId ? "max-[900px]:pl-9" : "max-[900px]:pl-14"}`}>{title}</header>
        <main className="min-w-0 pt-1 pr-[26px] pb-10 pl-6 print:p-0 max-[900px]:px-6 max-[600px]:px-4">{children}</main>
      </div>
    </div>
  );
}
