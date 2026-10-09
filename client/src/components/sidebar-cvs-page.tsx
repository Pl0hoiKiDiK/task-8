import { ProfileCvsPreview } from "@/components/profile-cvs-preview";

export function SidebarCvsPage({ role }: { role: "admin" | "employee" }) {
  return <ProfileCvsPreview view={role} />;
}
