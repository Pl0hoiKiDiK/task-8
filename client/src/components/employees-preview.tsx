"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";

const employees = [
  { first: "Rostislav", last: "Harlanov", email: "rostislav@example.com", department: "React", position: "Software Engineer" },
  { first: "Vanf", last: "Darkholme", email: "vanf@example.com", department: ".NET", position: "Network Engineer" },
  { first: "adasd", last: "", email: "adasd@example.com", department: "Blockchain", position: "" },
  { first: "Christopher", last: "Nolan", email: "christopher@example.com", department: "Blockchain", position: "DevOps Engineer" },
  { first: "", last: "", email: "employee@example.com", department: "Blockchain", position: "" },
  { first: "Марина", last: "", email: "marina@example.com", department: "DevOps", position: "Data Analyst" },
  { first: "Maksim", last: "Hancharou", email: "maksim@example.com", department: "Global", position: "Data Analyst" },
  { first: "Artem", last: "Lopatin", email: "artem@example.com", department: "Global", position: "Project Manager" },
  { first: "Alex", last: "Smith", email: "alex@example.com", department: "Java", position: "Data Analyst" },
  { first: "Artem", last: "Zhiznevskiy", email: "artem.z@example.com", department: "Java", position: "Data Analyst" },
];

const headingCell = "h-[52px] border-b border-[var(--border)] px-4 text-left text-sm font-medium leading-6 tracking-[.15px] max-[600px]:px-2";
const bodyCell = "h-[73px] overflow-hidden border-b border-[var(--border)] px-4 text-ellipsis whitespace-nowrap text-sm leading-5 tracking-[.15px] max-[600px]:px-2";
const firstColumn = "w-20 max-[600px]:w-[52px]";
const lastColumn = "w-12 !overflow-visible pr-5 text-right max-[600px]:w-8 max-[600px]:pr-0";

export function EmployeesPreview({ admin = false }: { admin?: boolean }) {
  const [search, setSearch] = useState("");
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const filteredEmployees = useMemo(() => employees.filter((person) =>
    `${person.first} ${person.last} ${person.email} ${person.department}`.toLowerCase().includes(search.toLowerCase()),
  ), [search]);

  return (
    <>
      <div className="flex min-h-14 items-start justify-between gap-4 pl-5 max-[600px]:pl-0">
        <label className="flex h-[46px] w-80 items-center gap-2.5 rounded-[40px] border border-[#aeaeae] px-3.5 max-[900px]:w-[276px] max-[600px]:w-full">
          <AppIcon name="search" className="h-6 w-6" />
          <span className="sr-only">Search employees</span>
          <input className="min-w-0 flex-1 border-0 bg-transparent text-base leading-[23px] tracking-[.15px] text-[var(--text)] outline-none placeholder:text-[var(--placeholder)]" type="search" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        {admin && (
          <button className="flex h-[46px] items-center gap-3.5 px-[18px] text-sm font-medium leading-[24.5px] tracking-[.4px] text-[var(--red)] uppercase max-[900px]:px-1" type="button" aria-label="Create user" disabled title="User creation is not connected yet">
            <AppIcon name="plus" className="h-6 w-6" /><span className="max-[900px]:hidden">Create user</span>
          </button>
        )}
      </div>

      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className={`${headingCell} ${firstColumn}`} aria-label="Avatar" />
            <th className={headingCell}>First Name</th>
            <th className={headingCell}>Last Name</th>
            <th className={`${headingCell} w-[27%] max-[900px]:hidden`}>Email</th>
            <th className={`${headingCell} w-[14%] max-[900px]:w-[28%]`}>Department <AppIcon name="sort" className="ml-1.5 inline-block h-[18px] w-[18px]" /></th>
            <th className={`${headingCell} w-[17%] max-[900px]:hidden`}>Position</th>
            <th className={`${headingCell} ${lastColumn}`} aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((person, index) => (
            <tr key={person.email}>
              <td className={`${bodyCell} ${firstColumn}`}><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--border)] text-xl text-[var(--surface)]">{person.first.charAt(0) || index + 1}</span></td>
              <td className={bodyCell}>{person.first}</td>
              <td className={bodyCell}>{person.last}</td>
              <td className={`${bodyCell} w-[27%] max-[900px]:hidden`}>{person.email}</td>
              <td className={`${bodyCell} w-[14%] max-[900px]:w-[28%]`}>{person.department}</td>
              <td className={`${bodyCell} w-[17%] max-[900px]:hidden`}>{person.position}</td>
              <td className={`${bodyCell} ${lastColumn}`}>
                {admin ? (
                  <div className="relative z-[3] inline-block">
                    <button
                      className="inline-grid h-10 w-8 place-items-center text-[var(--muted)]"
                      type="button"
                      aria-label={`Actions for ${person.first} ${person.last}`.trim()}
                      aria-haspopup="menu"
                      aria-expanded={openActionsFor === person.email}
                      onClick={() => setOpenActionsFor((current) => current === person.email ? null : person.email)}
                    >
                      <AppIcon name="more" className="h-6 w-6" />
                    </button>
                    {openActionsFor === person.email && (
                      <div className="absolute top-8 right-0 z-[5] w-[90px] rounded-lg border border-[var(--border)] bg-[var(--menu-surface)] py-1 text-left shadow-[0_4px_12px_#0002]" role="menu" aria-label={`Actions for ${person.first} ${person.last}`.trim()}>
                        <button className="block w-full px-3.5 py-[7px] text-left text-sm leading-[18px] text-[var(--text)]" type="button" role="menuitem" disabled>View</button>
                        <button className="block w-full px-3.5 py-[7px] text-left text-sm leading-[18px] text-[var(--text)]" type="button" role="menuitem" disabled>Update</button>
                        <button className="block w-full px-3.5 py-[7px] text-left text-sm leading-[18px] text-[var(--text)]" type="button" role="menuitem" disabled>Delete</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="inline-grid h-10 w-8 place-items-center text-[var(--muted)]" aria-hidden="true"><AppIcon name="chevron" className="h-6 w-6 rotate-180" /></span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
