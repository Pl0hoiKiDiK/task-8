"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/hooks";
import { languageOptions, setLanguage, setTheme, type LanguagePreference, type ThemePreference } from "@/lib/preferences-slice";

const themeKey = "cv-builder-theme";
const languageKey = "cv-builder-language";
const languageCodes: Record<LanguagePreference, string> = {
  English: "en", French: "fr", German: "de", Italian: "it", Polish: "pl",
  Portuguese: "pt", Russian: "ru", Spanish: "es", Ukrainian: "uk",
};

export function ThemeSync() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const theme = useAppSelector((state) => state.preferences.theme);
  const language = useAppSelector((state) => state.preferences.language);
  const awaitingSavedTheme = useRef<ThemePreference | null>(null);
  const awaitingSavedLanguage = useRef<LanguagePreference | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(themeKey);
    if ((saved === "system" || saved === "light" || saved === "dark") && saved !== store.getState().preferences.theme) {
      awaitingSavedTheme.current = saved;
      dispatch(setTheme(saved));
    }
    const savedLanguage = localStorage.getItem(languageKey);
    if (languageOptions.some((option) => option === savedLanguage) && savedLanguage !== store.getState().preferences.language) {
      awaitingSavedLanguage.current = savedLanguage as LanguagePreference;
      dispatch(setLanguage(savedLanguage as LanguagePreference));
    }
  }, [dispatch, store]);

  useEffect(() => {
    if (awaitingSavedTheme.current !== null && theme !== awaitingSavedTheme.current) return;
    document.documentElement.dataset.theme = theme;
    awaitingSavedTheme.current = null;
    localStorage.setItem(themeKey, theme);
  }, [theme]);

  useEffect(() => {
    if (awaitingSavedLanguage.current !== null && language !== awaitingSavedLanguage.current) return;
    document.documentElement.lang = languageCodes[language];
    awaitingSavedLanguage.current = null;
    localStorage.setItem(languageKey, language);
  }, [language]);

  return null;
}
