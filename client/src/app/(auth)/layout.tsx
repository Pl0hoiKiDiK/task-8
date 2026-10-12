import type { ReactNode } from "react";
import { GuestOnly } from "@/components/auth/guest-only";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestOnly>
      <main className="auth-layout">{children}</main>
    </GuestOnly>
  );
}