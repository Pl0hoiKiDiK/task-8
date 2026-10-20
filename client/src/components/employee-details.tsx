"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { EmployeeAvatar } from "@/components/employees-preview";
import { EMPLOYEE_QUERY } from "@/lib/employees/api";

export function EmployeeDetails({ userId, admin = false }: { userId: string; admin?: boolean }) {
  const prefix = admin ? "/admin" : "";
  const { data, loading, error, refetch } = useQuery(EMPLOYEE_QUERY, { variables: { userId }, fetchPolicy: "network-only" });
  const employee = data?.user;
  const name = employee ? [employee.profile.first_name, employee.profile.last_name].filter(Boolean).join(" ") || employee.email : "";
  const rawDate = employee?.created_at ?? "";
  const joined = rawDate ? new Date(/^\d+$/.test(rawDate) ? Number(rawDate) : rawDate) : null;

  return <section className="mx-auto max-w-4xl px-2 pb-10 sm:px-5" aria-label="User details">
    <Link href={`${prefix}/employees`} className="mb-8 inline-flex items-center gap-2 text-[var(--red)] hover:underline">← Employees</Link>
    {loading ? <p role="status">Loading user details…</p>
      : error || !employee ? <div><p role="alert">Could not load user details.</p><button type="button" className="mt-3 text-[var(--red)] underline" onClick={() => void refetch()}>Retry</button></div>
        : <div className="rounded-xl border border-[var(--border)] p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-5 border-b border-[var(--border)] pb-6">
            <EmployeeAvatar employee={employee} size={88} />
            <div className="min-w-0">
              <h1 className="text-2xl font-medium break-words">{name}</h1>
              <p className="mt-1 break-all text-[var(--muted)]">{employee.email}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Member since {joined && !Number.isNaN(joined.getTime()) ? joined.toDateString() : "—"}</p>
            </div>
          </div>
          <h2 className="mt-6 text-lg font-medium">Profile</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {[
              ["First Name", employee.profile.first_name],
              ["Last Name", employee.profile.last_name],
              ["Email", employee.email],
              ["Department", employee.department?.name],
              ["Position", employee.position?.name],
              ["Role", employee.role],
              ["Email status", employee.is_verified ? "Verified" : "Not verified"],
            ].map(([label, value]) => <div key={label} className="min-w-0 border-b border-[var(--border)] pb-3">
              <dt className="text-sm text-[var(--muted)]">{label}</dt>
              <dd className="mt-1 break-words">{value || "—"}</dd>
            </div>)}
          </dl>
        </div>}
  </section>;
}
