import type { ReactNode } from "react";
import { ProfileTabs } from "@/components/profile-navigation";
import { CvPreviewProvider } from "@/components/profile-cvs-data";

export default function AdminProfileLayout({ children }: { children: ReactNode }) {
  return <CvPreviewProvider><ProfileTabs basePath="/admin/profile" showCvs />{children}</CvPreviewProvider>;
}
