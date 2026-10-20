import type { ApolloClient } from "@apollo/client";
import { EMPLOYEE_OPTIONS_QUERY } from "@/lib/employees/api";

export type EmployeeOption = { id: string; name: string };
export type EmployeeOptions = { departments: EmployeeOption[]; positions: EmployeeOption[] };

export const MAX_OPTION_PAGES = 50;

export async function loadEmployeeOptions(client: Pick<ApolloClient, "query">): Promise<EmployeeOptions> {
    const departments: EmployeeOption[] = [];
    const positions: EmployeeOption[] = [];
    let pages = 1;
    for (let page = 1; page <= Math.min(pages, MAX_OPTION_PAGES); page += 1) {
        const result = await client.query({
            query: EMPLOYEE_OPTIONS_QUERY,
            variables: { params: { page, limit: 100 } },
            fetchPolicy: "network-only",
        });
        if (!result.data) throw new Error("Could not load options");
        departments.push(...result.data.departments.items);
        positions.push(...result.data.positions.items);
        pages = Math.max(Number(result.data.departments.total_pages) || 0, Number(result.data.positions.total_pages) || 0, 1);
    }
    return { departments, positions };
}
