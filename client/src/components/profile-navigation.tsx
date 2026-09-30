import Link from "next/link";
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

export function ProfileTabs({ role, section }: { role: ProfileRole; section: ProfileSection }) {
  const profileHref = role === "admin" ? "/admin/profile" : "/profile";
  const skillsHref = `${profileHref}/skills`;
  const languagesHref = `${profileHref}/languages`;
  const cvsHref = `${profileHref}/cvs`;

  return (
    <nav className="my-profile-tabs" aria-label="User details sections">
      <Link href={profileHref} className={`my-profile-tab${section === "Profile" ? " my-profile-tab--active" : ""}`} aria-current={section === "Profile" ? "page" : undefined}>Profile</Link>
      <Link href={skillsHref} className={`my-profile-tab${section === "Skills" ? " my-profile-tab--active" : ""}`} aria-current={section === "Skills" ? "page" : undefined}>Skills</Link>
      <Link href={languagesHref} className={`my-profile-tab${section === "Languages" ? " my-profile-tab--active" : ""}`} aria-current={section === "Languages" ? "page" : undefined}>Languages</Link>
      {role === "admin" ? (
        <Link href={cvsHref} className={`my-profile-tab${section === "CVs" ? " my-profile-tab--active" : ""}`} aria-current={section === "CVs" ? "page" : undefined}>CVs</Link>
      ) : <span className="my-profile-tab">CVs</span>}
    </nav>
  );
}
