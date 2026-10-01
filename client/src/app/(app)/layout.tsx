import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { CvPreviewProvider, sidebarCvs } from "@/components/profile-cvs-data";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return <CvPreviewProvider initialRecords={sidebarCvs}><AppShell>{children}</AppShell></CvPreviewProvider>;
}
