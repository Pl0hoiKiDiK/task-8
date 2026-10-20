import type { ReactNode } from "react";
import { AppDataBoundary } from "@/components/app-data-boundary";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return <AppDataBoundary>{children}</AppDataBoundary>;
}
