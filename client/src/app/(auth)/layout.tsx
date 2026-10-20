import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="flex min-h-dvh flex-col items-center">{children}</main>;
}