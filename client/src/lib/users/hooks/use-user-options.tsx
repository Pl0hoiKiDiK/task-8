import { useQuery } from "@apollo/client/react";
import { DEPARTMENTS_QUERY, POSITIONS_QUERY } from "@/lib/users/api/graphql";

export function useUserOptions() {
    const departments = useQuery(DEPARTMENTS_QUERY);
    const positions = useQuery(POSITIONS_QUERY);

    return {
        departments: departments.data?.departments.items ?? [],
        positions: positions.data?.positions.items ?? [],
        loading: departments.loading || positions.loading,
        error: departments.error ?? positions.error,
        refetch: () => Promise.all([departments.refetch(), positions.refetch()]),
    };
}
