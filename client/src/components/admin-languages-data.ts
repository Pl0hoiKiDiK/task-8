export type AdminLanguage = {
  id: string;
  name: string;
  iso: string;
  nativeName: string;
};

export type LanguageFields = Pick<AdminLanguage, "name" | "iso" | "nativeName">;
export type LanguageFieldErrors = Partial<Record<keyof LanguageFields, string>>;
export type LanguageSort = { field: "name" | "iso"; direction: "asc" | "desc" } | null;

export const initialAdminLanguages: AdminLanguage[] = [
  { id: "english", name: "English", iso: "EN", nativeName: "English" },
  { id: "russian", name: "Russian", iso: "RU", nativeName: "Русский" },
  { id: "german", name: "German", iso: "DE", nativeName: "Deutsch" },
  { id: "polish", name: "Polish", iso: "PL", nativeName: "Język polski" },
  { id: "portuguese", name: "Portuguese", iso: "PT", nativeName: "Português" },
  { id: "italian", name: "Italian", iso: "IT", nativeName: "Lingua italiana" },
  { id: "belarusian", name: "Belarusian", iso: "BE", nativeName: "Беларуская мова" },
];

export function normalizeLanguageFields(fields: LanguageFields): LanguageFields {
  return {
    name: fields.name.trim(),
    iso: fields.iso.trim().toUpperCase(),
    nativeName: fields.nativeName.trim(),
  };
}

export function validateLanguageFields(
  fields: LanguageFields,
  languages: AdminLanguage[],
  exceptId?: string,
): LanguageFieldErrors {
  const { name, iso, nativeName } = normalizeLanguageFields(fields);
  const errors: LanguageFieldErrors = {};

  if (!name) errors.name = "Name is required";
  else if (languages.some((item) => item.id !== exceptId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    errors.name = "Language already exists";
  }

  if (!iso) errors.iso = "ISO is required";
  else if (iso.length > 5 || !/^[A-Z-]+$/.test(iso)) errors.iso = "Enter a valid ISO code (up to 5 characters)";
  else if (languages.some((item) => item.id !== exceptId && item.iso.toUpperCase() === iso)) {
    errors.iso = "ISO code already exists";
  }

  if (!nativeName) errors.nativeName = "Native name is required";
  return errors;
}

export function filterAndSortLanguages(
  languages: AdminLanguage[],
  search: string,
  sort: LanguageSort,
): AdminLanguage[] {
  const query = search.trim().toLocaleLowerCase();
  const result = languages.filter((language) => language.name.toLocaleLowerCase().includes(query));
  if (sort) {
    result.sort((a, b) => {
      const comparison = a[sort.field].localeCompare(b[sort.field], undefined, { sensitivity: "base" });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }
  return result;
}
