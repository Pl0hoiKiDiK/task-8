import Image from "next/image";

export type IconName =
  | "logo" | "employees" | "skills" | "languages" | "cvs"
  | "departments" | "positions" | "projects" | "profile"
  | "settings" | "logout" | "chevron" | "sort" | "search"
  | "more" | "plus" | "eye" | "download" | "arrow-nav"
  | "person-red" | "cross-green";

const iconFiles: Record<Exclude<IconName, "plus" | "arrow-nav" | "person-red" | "cross-green">, [string, string]> = {
  logo: ["logo-light.svg", "logo-dark.svg"],
  employees: ["nav-employees-active-light.svg", "nav-employees-active-dark.svg"],
  skills: ["nav-skills-inactive-light.svg", "nav-skills-inactive-dark.svg"],
  languages: ["nav-languages-inactive-light.svg", "nav-languages-inactive-dark.svg"],
  cvs: ["nav-cvs-inactive-light.svg", "nav-cvs-inactive-dark.svg"],
  departments: ["nav-departments-inactive-light.svg", "nav-departments-inactive-dark.svg"],
  positions: ["nav-positions-inactive-light.svg", "nav-positions-inactive-dark.svg"],
  projects: ["nav-projects-inactive-light.svg", "nav-projects-inactive-dark.svg"],
  profile: ["profile-light.svg", "profile-dark.svg"],
  settings: ["settings-light.svg", "settings-dark.svg"],
  logout: ["logout-light.svg", "logout-dark.svg"],
  chevron: ["arrow-light.svg", "arrow-dark.svg"],
  sort: ["arrow-up-light.svg", "arrow-up-dark.svg"],
  search: ["search-light.svg", "search-dark.svg"],
  more: ["dots-light.svg", "dots-dark.svg"],
  eye: ["eye-light.svg", "eye-dark.svg"],
  download: ["download-light.svg", "download-dark.svg"],
};

export function AppIcon({ name, className = "" }: { name: IconName; className?: string }) {
  const size = name === "sort" ? 18 : name === "arrow-nav" ? 20 : name === "download" ? 35 : 24;
  const classes = `app-icon ${className}`.trim();
  if (name === "plus" || name === "arrow-nav" || name === "person-red" || name === "cross-green") {
    return <Image src={`/icons/${name}.svg`} alt="" aria-hidden="true" className={classes} width={size} height={size} unoptimized />;
  }

  const [light, dark] = iconFiles[name];
  return (
    <span className={classes} aria-hidden="true">
      <Image src={`/icons/${light}`} alt="" className="app-icon-light" width={size} height={size} unoptimized />
      <Image src={`/icons/${dark}`} alt="" className="app-icon-dark" width={size} height={size} unoptimized />
    </span>
  );
}
