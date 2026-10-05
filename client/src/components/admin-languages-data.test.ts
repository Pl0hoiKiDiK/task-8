import { describe, expect, it } from "vitest";
import {
  filterAndSortLanguages,
  normalizeLanguageFields,
  validateLanguageFields,
  type AdminLanguage,
} from "./admin-languages-data";

const languages: AdminLanguage[] = [
  { id: "english", name: "English", iso: "EN", nativeName: "English" },
  { id: "russian", name: "Russian", iso: "RU", nativeName: "Русский" },
  { id: "german", name: "German", iso: "DE", nativeName: "Deutsch" },
];

describe("admin language catalog", () => {
  it("normalizes ISO and rejects duplicate names and codes while allowing edits to keep their values", () => {
    const fields = normalizeLanguageFields({ name: "  ENGLISH ", iso: " en ", nativeName: " English " });
    expect(fields).toEqual({ name: "ENGLISH", iso: "EN", nativeName: "English" });
    expect(validateLanguageFields(fields, languages)).toEqual({
      name: "Language already exists",
      iso: "ISO code already exists",
    });
    expect(validateLanguageFields(fields, languages, "english")).toEqual({});
    expect(validateLanguageFields({ name: "", iso: "", nativeName: "" }, languages)).toEqual({
      name: "Name is required",
      iso: "ISO is required",
      nativeName: "Native name is required",
    });
  });

  it("filters names without regard to case and sorts either column", () => {
    expect(filterAndSortLanguages(languages, "GER", null).map((item) => item.name)).toEqual(["German"]);
    expect(filterAndSortLanguages(languages, "", { field: "name", direction: "asc" }).map((item) => item.name))
      .toEqual(["English", "German", "Russian"]);
    expect(filterAndSortLanguages(languages, "", { field: "iso", direction: "desc" }).map((item) => item.iso))
      .toEqual(["RU", "EN", "DE"]);
  });
});
