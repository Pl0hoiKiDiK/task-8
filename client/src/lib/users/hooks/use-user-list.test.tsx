// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useQuery = vi.fn();
vi.mock("@apollo/client/react", () => ({ useQuery: (...args: unknown[]) => useQuery(...args) }));

import { useUsersList, USERS_PAGE_SIZE } from "./use-user-list";

const page = (items: unknown[], total_pages = 1, total = items.length) => ({ users: { items, total, page: 1, limit: 10, total_pages } });
const lastParams = () => useQuery.mock.lastCall![1].variables.params;

beforeEach(() => {
    vi.useFakeTimers();
    useQuery.mockReset();
    useQuery.mockReturnValue({ data: page([{ id: "1" }]), previousData: undefined, loading: false, error: undefined, refetch: vi.fn() });
});
afterEach(() => vi.useRealTimers());

describe("useUsersList", () => {
    it("начальные параметры: первая страница, без поиска и сортировки", () => {
        renderHook(() => useUsersList());
        expect(lastParams()).toEqual({ page: 1, limit: USERS_PAGE_SIZE });
    });

    it("поиск уходит на сервер с debounce и сбрасывает страницу", () => {
        const { result } = renderHook(() => useUsersList());
        act(() => result.current.setPage(3));
        act(() => result.current.setSearchInput("  ann "));
        expect(lastParams().search).toBeUndefined();
        act(() => { vi.advanceTimersByTime(300); });
        expect(lastParams()).toMatchObject({ search: "ann", page: 1 });
    });

    it("сортировка: первый клик asc, второй desc, другая колонка снова asc", () => {
        const { result } = renderHook(() => useUsersList());
        act(() => result.current.toggleSort("last_name"));
        expect(lastParams()).toMatchObject({ sort_by: "last_name", sort_order: "asc" });
        act(() => result.current.toggleSort("last_name"));
        expect(lastParams()).toMatchObject({ sort_by: "last_name", sort_order: "desc" });
        act(() => result.current.toggleSort("first_name"));
        expect(lastParams()).toMatchObject({ sort_by: "first_name", sort_order: "asc" });
    });

    it("смена сортировки возвращает на первую страницу", () => {
        const { result } = renderHook(() => useUsersList());
        act(() => result.current.setPage(2));
        act(() => result.current.toggleSort("last_name"));
        expect(result.current.page).toBe(1);
    });

    it("сортировка по department / position отключена и не уходит на сервер", () => {
        const { result } = renderHook(() => useUsersList());
        act(() => result.current.toggleSort("department"));
        act(() => result.current.toggleSort("position"));
        expect(result.current.sort).toBeNull();
        expect(lastParams().sort_by).toBeUndefined();
    });

    it("пока грузится новая страница, показываются предыдущие данные", () => {
        useQuery.mockReturnValue({ data: undefined, previousData: page([{ id: "old" }], 2, 12), loading: true, error: undefined, refetch: vi.fn() });
        const { result } = renderHook(() => useUsersList());
        expect(result.current.users).toEqual([{ id: "old" }]);
        expect(result.current.total).toBe(12);
        expect(result.current.loading).toBe(true);
    });

    it("если страница стала пустой после удаления, уходит на последнюю существующую", () => {
        useQuery.mockReturnValue({ data: page([{ id: "1" }], 3, 25), previousData: undefined, loading: false, error: undefined, refetch: vi.fn() });
        const { result, rerender } = renderHook(() => useUsersList());
        act(() => result.current.setPage(3));
        expect(result.current.page).toBe(3);
        useQuery.mockReturnValue({ data: page([], 2, 12), previousData: undefined, loading: false, error: undefined, refetch: vi.fn() });
        rerender();
        expect(result.current.page).toBe(2);
    });

    it("ошибка отдаётся только если данных ещё нет", () => {
        const err = new Error("x");
        useQuery.mockReturnValue({ data: undefined, previousData: undefined, loading: false, error: err, refetch: vi.fn() });
        expect(renderHook(() => useUsersList()).result.current.error).toBe(err);
        useQuery.mockReturnValue({ data: page([{ id: "1" }]), previousData: undefined, loading: false, error: err, refetch: vi.fn() });
        expect(renderHook(() => useUsersList()).result.current.error).toBeUndefined();
    });
});
