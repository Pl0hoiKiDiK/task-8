import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { CvPreviewProvider, sidebarCvs } from "@/components/profile-cvs-data";
import { LanguagePreviewProvider } from "@/components/profile-languages-data";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return <CvPreviewProvider initialRecords={sidebarCvs}><LanguagePreviewProvider><AppShell>{children}</AppShell></LanguagePreviewProvider></CvPreviewProvider>;
}
