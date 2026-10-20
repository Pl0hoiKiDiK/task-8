import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { CvPreviewProvider } from "@/components/profile-cvs-data";
import { LanguagePreviewProvider } from "@/components/profile-languages-data";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return <CvPreviewProvider><LanguagePreviewProvider><AppShell>{children}</AppShell></LanguagePreviewProvider></CvPreviewProvider>;
}
