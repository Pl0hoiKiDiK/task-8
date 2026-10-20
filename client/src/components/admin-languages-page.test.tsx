import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { LANGUAGES_QUERY } from "@/lib/catalog-api";
import { AdminLanguagesPage } from "./admin-languages-page";

afterEach(cleanup);

describe("admin languages API", () => {
  it("maps server ISO and native name fields and filters loaded languages", async () => {
    const mocks = [{ request: { query: LANGUAGES_QUERY, variables: { params: { page: 1, limit: 100 } } }, result: { data: { languages: { items: [
      { id: "1", name: "Belarusian", iso2: "BE", native_name: "Беларуская мова" },
      { id: "2", name: "English", iso2: "EN", native_name: "English" },
    ], total_pages: 1 } } } }];
    render(<MockedProvider mocks={mocks}><AdminLanguagesPage /></MockedProvider>);
    expect(await screen.findByText("Беларуская мова")).toBeVisible();
    expect(screen.getByRole("cell", { name: "BE" })).toBeVisible();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search languages by name" }), { target: { value: "not found" } });
    expect(screen.getByText("No languages found")).toBeVisible();
  });
});
