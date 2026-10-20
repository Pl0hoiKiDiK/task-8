import type { ApolloClient } from "@apollo/client";
import { describe, expect, it, vi } from "vitest";
import { DEPARTMENTS_QUERY, loadAllCatalogItems } from "./catalog-api";

describe("loadAllCatalogItems", () => {
  it("collects all pages and stops after the reported last page", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ data: { departments: { items: [{ id: "1", name: "A" }], total_pages: 2 } } })
      .mockResolvedValueOnce({ data: { departments: { items: [{ id: "2", name: "B" }], total_pages: 2 } } });

    await expect(loadAllCatalogItems({ query } as unknown as ApolloClient, DEPARTMENTS_QUERY, "departments"))
      .resolves.toEqual([{ id: "1", name: "A" }, { id: "2", name: "B" }]);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it.each([null, undefined, Number.POSITIVE_INFINITY, 51])("rejects invalid total_pages %s without requesting another page", async (total_pages) => {
    const query = vi.fn().mockResolvedValue({ data: { departments: { items: [], total_pages } } });

    await expect(loadAllCatalogItems({ query } as unknown as ApolloClient, DEPARTMENTS_QUERY, "departments"))
      .rejects.toThrow("Invalid departments pagination");
    expect(query).toHaveBeenCalledTimes(1);
  });
});
