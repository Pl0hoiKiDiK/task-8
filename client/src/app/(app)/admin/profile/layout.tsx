import type { ReactNode } from "react";
import { ProfileTabs } from "@/components/profile-navigation";

export default function AdminProfileLayout({ children }: { children: ReactNode }) {
  return <><ProfileTabs basePath="/admin/profile" showCvs />{children}</>;
}
