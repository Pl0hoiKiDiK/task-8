"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useApolloClient } from "@apollo/client/react";
import { LANGUAGES_QUERY, loadAllCatalogItems } from "@/lib/catalog-api";
import { ADD_PROFILE_LANGUAGE, DELETE_PROFILE_LANGUAGE, UPDATE_PROFILE_LANGUAGE } from "@/lib/cv-api";
import { useCvPreviewData } from "@/components/profile-cvs-data";
import type { ProficiencyTone } from "@/components/profile-proficiency-item";

export const proficiencyOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"] as const;
export type LanguageProficiency = (typeof proficiencyOptions)[number];
export type ProfileLanguage = { name: string; proficiency: LanguageProficiency };

export const proficiencyDisplay: Record<LanguageProficiency, { tone: ProficiencyTone; level: number }> = {
  A1: { tone: "gray", level: 20 }, A2: { tone: "blue", level: 35 },
  B1: { tone: "green", level: 50 }, B2: { tone: "green", level: 60 },
  C1: { tone: "yellow", level: 80 }, C2: { tone: "red", level: 95 },
  Native: { tone: "red", level: 100 },
};

type LanguageData = {
  languages: ProfileLanguage[];
  languageOptions: string[];
  optionsState: "loading" | "ready" | "error";
  reloadOptions: () => Promise<void>;
  addLanguage: (language: ProfileLanguage) => Promise<void>;
  updateLanguage: (language: ProfileLanguage) => Promise<void>;
  removeLanguages: (names: string[]) => Promise<void>;
};
const LanguageContext = createContext<LanguageData | null>(null);

export function LanguagePreviewProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const { currentUserId, profile, reload } = useCvPreviewData();
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [optionsState, setOptionsState] = useState<LanguageData["optionsState"]>("loading");
  const languages = profile?.languages ?? [];

  const reloadOptions = useCallback(async () => {
    setOptionsState("loading");
    try {
      const items = await loadAllCatalogItems(client, LANGUAGES_QUERY, "languages");
      setLanguageOptions(items.map((item) => item.name));
      setOptionsState("ready");
    } catch (error) {
      setOptionsState("error");
      throw error;
    }
  }, [client]);

  useEffect(() => {
    if (!currentUserId) return;
    const timer = window.setTimeout(() => { void reloadOptions().catch(() => undefined); }, 0);
    return () => window.clearTimeout(timer);
  }, [currentUserId, reloadOptions]);

  async function addLanguage(language: ProfileLanguage) {
    if (!languageOptions.includes(language.name)) throw new Error("Language is unavailable");
    if (languages.some((item) => item.name === language.name)) throw new Error("Language already exists");
    await client.mutate({ mutation: ADD_PROFILE_LANGUAGE, variables: { language: { userId: currentUserId, ...language } } });
    await reload();
  }
  async function updateLanguage(language: ProfileLanguage) {
    await client.mutate({ mutation: UPDATE_PROFILE_LANGUAGE, variables: { language: { userId: currentUserId, ...language } } });
    await reload();
  }
  async function removeLanguages(names: string[]) {
    await client.mutate({ mutation: DELETE_PROFILE_LANGUAGE, variables: { language: { userId: currentUserId, name: names } } });
    await reload();
  }

  return <LanguageContext.Provider value={{ languages, languageOptions, optionsState, reloadOptions, addLanguage, updateLanguage, removeLanguages }}>{children}</LanguageContext.Provider>;
}

export function useLanguagePreviewData() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("Language data provider is missing");
  return context;
}
