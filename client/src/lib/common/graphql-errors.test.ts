import { describe, expect, it, vi } from "vitest";
import { loadEmployeeOptions, MAX_OPTION_PAGES } from "@/lib/employees/load-options";

const page = (departments: number, positions: number, totalPages: unknown) => ({
    data: {
        departments: { items: Array.from({ length: departments }, (_, i) => ({ id: `d${i}`, name: `D${i}` })), total_pages: totalPages },
        positions: { items: Array.from({ length: positions }, (_, i) => ({ id: `p${i}`, name: `P${i}` })), total_pages: totalPages },
    },
});

describe("loadEmployeeOptions", () => {
    it("collects every page", async () => {
        const query = vi.fn().mockResolvedValueOnce(page(2, 1, 2)).mockResolvedValueOnce(page(1, 1, 2));
        const result = await loadEmployeeOptions({ query } as never);
        expect(query).toHaveBeenCalledTimes(2);
        expect(query.mock.calls[1][0].variables).toEqual({ params: { page: 2, limit: 100 } });
        expect(result.departments).toHaveLength(3);
        expect(result.positions).toHaveLength(2);
    });
    it("total_pages 0 or garbage means a single request", async () => {
        for (const total of [0, undefined, "x", null]) {
            const query = vi.fn().mockResolvedValue(page(1, 1, total));
            await loadEmployeeOptions({ query } as never);
            expect(query).toHaveBeenCalledTimes(1);
        }
    });
    it("never asks for more than the page cap", async () => {
        const query = vi.fn().mockResolvedValue(page(1, 1, 1_000_000));
        await loadEmployeeOptions({ query } as never);
        expect(query).toHaveBeenCalledTimes(MAX_OPTION_PAGES);
    });
    it("fails when the response has no data", async () => {
        await expect(loadEmployeeOptions({ query: vi.fn().mockResolvedValue({ data: undefined }) } as never)).rejects.toThrow();
    });
});
