import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useDebouncedValue } from "@/lib/common/use-debounced-value";
import { USERS_QUERY, type SearchParams, type UserListItem } from "@/lib/users/api/graphql";

export const USERS_PAGE_SIZE = 10;

export type UserSortKey = "first_name" | "last_name" | "department" | "position";
export type SortOrder = "asc" | "desc";
export type UserSort = { by: UserSortKey; order: SortOrder } | null;

/**
 * Что уходит в sort_by на сервер. Бэкенд (users.service) умеет сортировать по
 * profile.first_name / profile.last_name и по колонкам user.*.
 *
 * Проверено запросом в Playground (19.10.2026): sort_by "department" / "position" сортирует
 * по колонке внешнего ключа (ID), а не по названию (первыми идут отдел id=1 «React» и должность
 * id=1 «Software Engineer»; при desc первыми идут пользователи с null). sort_by "department.name"
 * отвечает 500 internalServerError. Поэтому сортировка по этим двум колонкам выключена флагами ниже
 * и должна быть включена, когда бэкенд начнёт сортировать по названию.
 */
export const SORTABLE_BY_SERVER: Record<UserSortKey, boolean> = {
    first_name: true,
    last_name: true,
    department: false,
    position: false,
};

const SORT_FIELD: Record<UserSortKey, string> = {
    first_name: "first_name",
    last_name: "last_name",
    department: "department",
    position: "position",
};

export function useUsersList() {
    const [searchInput, setSearchInput] = useState("");
    const search = useDebouncedValue(searchInput.trim());
    const [sort, setSort] = useState<UserSort>(null);
    const [page, setPage] = useState(1);

    const params: SearchParams = {
        page,
        limit: USERS_PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(sort ? { sort_by: SORT_FIELD[sort.by], sort_order: sort.order } : {}),
    };

    const { data, previousData, loading, error, refetch } = useQuery(USERS_QUERY, {
        variables: { params },
        notifyOnNetworkStatusChange: true,
    });

    // Пока грузится новая страница/поиск, таблица остаётся с прошлыми данными.
    const current = data ?? previousData;
    const users: UserListItem[] = current?.users.items ?? [];
    const total = current?.users.total ?? 0;
    const totalPages = current?.users.total_pages ?? 0;

    // После удаления последней записи на странице уходим на предыдущую.
    useEffect(() => {
        if (data && totalPages > 0 && page > totalPages) setPage(totalPages);
    }, [data, page, totalPages]);

    // Новый поисковый запрос всегда начинается с первой страницы.
    useEffect(() => {
        setPage(1);
    }, [search]);

    function toggleSort(by: UserSortKey) {
        if (!SORTABLE_BY_SERVER[by]) return;
        setSort((prev) => (prev?.by === by ? { by, order: prev.order === "asc" ? "desc" : "asc" } : { by, order: "asc" }));
        setPage(1);
    }

    return {
        searchInput,
        setSearchInput,
        sort,
        toggleSort,
        page,
        setPage,
        users,
        total,
        totalPages,
        loading,
        error: error && !data ? error : undefined,
        refetch: () => refetch(),
    };
}
