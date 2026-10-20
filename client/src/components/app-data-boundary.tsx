"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { CvPreviewProvider, type CvDataScope } from "@/components/profile-cvs-data";
import { LanguagePreviewProvider } from "@/components/profile-languages-data";

function dataScope(pathname: string): CvDataScope | null {
  if (/^\/(?:admin\/)?cvs\/[^/]+\/preview$/.test(pathname)) return "cv-preview";
  if (/^\/(?:admin\/)?cvs\/[^/]+\/projects$/.test(pathname)) return "cv-projects";
  if (/^\/(?:admin\/)?cvs\/[^/]+\/skills$/.test(pathname)) return "cv-skills";
  if (/^\/(?:admin\/)?cvs\/[^/]+$/.test(pathname)) return "cv-details";
  if (/^\/(?:admin\/profile\/languages|profile\/languages|languages)$/.test(pathname)) return "profile-languages";
  if (/^\/(?:admin\/profile\/skills|profile\/skills|skills)$/.test(pathname)) return "profile-skills";
  if (/^\/(?:admin\/cvs|cvs|admin\/profile\/cvs)$/.test(pathname)) return "cvs";
  return null;
}

export function AppDataBoundary({ children }: { children: ReactNode }) {
  const scope = dataScope(usePathname());
  if (!scope) return <AppShell>{children}</AppShell>;

  const content = <AppShell>{children}</AppShell>;
  return <CvPreviewProvider key={scope} scope={scope}>
    {scope === "profile-languages" ? <LanguagePreviewProvider>{content}</LanguagePreviewProvider> : content}
  </CvPreviewProvider>;
}
