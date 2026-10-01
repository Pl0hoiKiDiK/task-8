import type { ReactNode } from "react";
import { ProfileTabs } from "@/components/profile-navigation";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <><ProfileTabs basePath="/profile" />{children}</>;
}
