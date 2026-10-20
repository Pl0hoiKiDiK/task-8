import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { POSITIONS_QUERY } from "@/lib/catalog-api";
import { AdminPositionsPage } from "./admin-positions-page";

afterEach(cleanup);

describe("admin positions API", () => {
  it("loads the full catalog and searches and sorts the response", async () => {
    const mocks = [{ request: { query: POSITIONS_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { positions: { items: [
      { id: "1", name: "Software Engineer" }, { id: "2", name: "Data Architect" },
    ], total_pages: 1 } } } }];
    render(<MockedProvider mocks={mocks}><AdminPositionsPage /></MockedProvider>);
    expect(await screen.findByRole("button", { name: "Actions for Software Engineer" })).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search positions by name" }), { target: { value: "architect" } });
    expect(screen.getByRole("button", { name: "Actions for Data Architect" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Actions for Software Engineer" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search positions by name" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "ascending");
  });
});
