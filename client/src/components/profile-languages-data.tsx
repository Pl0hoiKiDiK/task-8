"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProficiencyTone } from "@/components/profile-proficiency-item";

export const languageOptions = ["English", "Russian", "German", "French", "Spanish", "Italian", "Polish", "Portuguese", "Ukrainian", "Chinese", "Japanese"] as const;
export const proficiencyOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"] as const;

export type LanguageProficiency = (typeof proficiencyOptions)[number];
export type ProfileLanguage = { name: string; proficiency: LanguageProficiency };

export const previewLanguages: ProfileLanguage[] = [
  { name: "Russian", proficiency: "Native" },
  { name: "English", proficiency: "B2" },
];

export const proficiencyDisplay: Record<LanguageProficiency, { tone: ProficiencyTone; level: number }> = {
  A1: { tone: "gray", level: 20 },
  A2: { tone: "blue", level: 35 },
  B1: { tone: "green", level: 50 },
  B2: { tone: "green", level: 60 },
  C1: { tone: "yellow", level: 80 },
  C2: { tone: "red", level: 95 },
  Native: { tone: "red", level: 100 },
};

type LanguagePreviewContextValue = {
  languages: ProfileLanguage[];
  addLanguage: (language: ProfileLanguage) => void;
  updateLanguage: (language: ProfileLanguage) => void;
  removeLanguages: (names: string[]) => void;
};

const LanguagePreviewContext = createContext<LanguagePreviewContextValue | null>(null);

export function LanguagePreviewProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<ProfileLanguage[]>(previewLanguages);

  const addLanguage = (language: ProfileLanguage) => {
    if (!languageOptions.some((name) => name === language.name)) throw new Error("Language is unavailable");
    if (languages.some((item) => item.name === language.name)) throw new Error("Language already exists");
    setLanguages((current) => [...current, language]);
  };

  const updateLanguage = (language: ProfileLanguage) => {
    if (!languages.some((item) => item.name === language.name)) throw new Error("Language was not found");
    setLanguages((current) => current.map((item) => item.name === language.name ? language : item));
  };

  const removeLanguages = (names: string[]) => {
    const selected = new Set(names);
    setLanguages((current) => current.filter((item) => !selected.has(item.name)));
  };

  return <LanguagePreviewContext.Provider value={{ languages, addLanguage, updateLanguage, removeLanguages }}>{children}</LanguagePreviewContext.Provider>;
}

export function useLanguagePreviewData() {
  const context = useContext(LanguagePreviewContext);
  if (!context) throw new Error("Language preview data provider is missing");
  return context;
}
