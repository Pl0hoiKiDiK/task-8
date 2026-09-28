"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";

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

export function EmployeesPreview({ admin = false }: { admin?: boolean }) {
  const [search, setSearch] = useState("");
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const filteredEmployees = useMemo(() => employees.filter((person) =>
    `${person.first} ${person.last} ${person.email} ${person.department}`.toLowerCase().includes(search.toLowerCase()),
  ), [search]);

  return (
    <AppShell title="Employees" role={admin ? "admin" : "user"}>
      <div className="employees-toolbar">
        <label className="search-field">
          <AppIcon name="search" />
          <span className="sr-only">Search employees</span>
          <input type="search" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        {admin && (
          <button className="create-action" type="button" aria-label="Create user" disabled title="User creation is not connected yet">
            <AppIcon name="plus" /><span>Create user</span>
          </button>
        )}
      </div>

      <table className="employees-table">
        <thead>
          <tr>
            <th aria-label="Avatar" />
            <th>First Name</th>
            <th>Last Name</th>
            <th className="employee-email">Email</th>
            <th className="employee-department">Department <AppIcon name="sort" className="sort-indicator" /></th>
            <th className="employee-position">Position</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((person, index) => (
            <tr key={person.email}>
              <td><span className="employee-avatar">{person.first.charAt(0) || index + 1}</span></td>
              <td>{person.first}</td>
              <td>{person.last}</td>
              <td className="employee-email">{person.email}</td>
              <td className="employee-department">{person.department}</td>
              <td className="employee-position">{person.position}</td>
              <td>
                {admin ? (
                  <div className="employee-actions">
                    <button
                      className="employee-row-action"
                      type="button"
                      aria-label={`Actions for ${person.first} ${person.last}`.trim()}
                      aria-haspopup="menu"
                      aria-expanded={openActionsFor === person.email}
                      onClick={() => setOpenActionsFor((current) => current === person.email ? null : person.email)}
                    >
                      <AppIcon name="more" />
                    </button>
                    {openActionsFor === person.email && (
                      <div className="employee-actions-menu" role="menu" aria-label={`Actions for ${person.first} ${person.last}`.trim()}>
                        <button type="button" role="menuitem" disabled>View</button>
                        <button type="button" role="menuitem" disabled>Update</button>
                        <button type="button" role="menuitem" disabled>Delete</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="employee-row-action employee-row-action--arrow" aria-hidden="true"><AppIcon name="chevron" /></span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}
